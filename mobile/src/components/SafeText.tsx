// SafeText component for robust text rendering across the app
// Created: 2025-06-03
// Purpose: Prevent "Text strings must be rendered within a <Text> component" errors

import React from 'react';
import { Text, TextProps } from 'react-native';

interface SafeTextProps extends TextProps {
  children: React.ReactNode;
  fallbackText?: string;
  debug?: boolean;
}

/**
 * SafeText component that safely renders children within a Text component
 * Automatically handles non-string children by converting them to strings
 * 
 * @param children - The content to render (strings, numbers, or React elements)
 * @param fallbackText - Text to show if children cannot be safely rendered
 * @param debug - Enable debug logging for troubleshooting
 */
const SafeText: React.FC<SafeTextProps> = ({ 
  children, 
  fallbackText = 'Unable to display text', 
  debug = false,
  ...props 
}) => {
  const convertToSafeText = (value: React.ReactNode): string => {
    // Handle null or undefined
    if (value === null || value === undefined) {
      return '';
    }

    // Handle strings and numbers (safe for Text)
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return String(value);
    }

    // Handle arrays
    if (Array.isArray(value)) {
      const processedArray = value
        .map(item => convertToSafeText(item))
        .filter(item => item !== '') // Remove empty strings from null/undefined
        .join(', ');
      
      if (debug) {
        console.warn(`SafeText: Converting array to string: ${processedArray}`);
      }
      
      return processedArray;
    }

    // Handle React elements
    if (React.isValidElement(value)) {
      // If it's a Text component, extract its children
      if (value.type === Text) {
        return convertToSafeText(value.props.children);
      }
      
      // For other React elements, convert to string representation
      const elementName = typeof value.type === 'string' 
        ? value.type 
        : (value.type as any)?.displayName || (value.type as any)?.name || 'Element';
      
      if (debug) {
        console.warn(`SafeText: Converting React element <${elementName}> to string`);
      }
      
      return `[${elementName}]`;    }

    // Handle objects
    if (typeof value === 'object') {
      try {
        // First try to call toString() explicitly to catch throwing toString methods
        if (value.toString && typeof value.toString === 'function') {
          try {
            const stringResult = value.toString();
            // Check if toString() returned the default [object Object] - if so, use JSON.stringify instead
            if (stringResult === '[object Object]') {
              const stringified = JSON.stringify(value);
              if (debug) {
                console.warn(`SafeText: Converting object to JSON string: ${stringified}`);
              }
              return stringified;
            } else {
              if (debug) {
                console.warn(`SafeText: Converting object using toString(): ${stringResult}`);
              }
              return stringResult;
            }
          } catch (toStringError) {
            // toString() threw an error, this should trigger our fallback mechanism
            throw new Error(`Object toString() failed: ${toStringError}`);
          }
        }
        
        // If no toString method, use JSON.stringify
        const stringified = JSON.stringify(value);
        if (debug) {
          console.warn(`SafeText: Converting object to JSON string: ${stringified}`);
        }
        return stringified;
      } catch (e) {
        if (debug) {
          console.warn(`SafeText: Failed to stringify object`, e);
        }
        // Throw the error to trigger fallback mechanism
        throw new Error(`Object conversion failed: ${e}`);
      }
    }

    // Handle any other types
    try {
      const stringValue = String(value);
      if (debug) {
        console.warn(`SafeText: Converting ${typeof value} to string: ${stringValue}`);
      }
      
      return stringValue;
    } catch (e) {
      // If String() conversion fails, throw to trigger fallback
      throw new Error(`Failed to convert ${typeof value} to string: ${e}`);
    }
  };

  const processChildren = (childNodes: React.ReactNode): string => {
    // Handle single values directly
    if (!React.isValidElement(childNodes) || !Array.isArray(childNodes)) {
      return convertToSafeText(childNodes);
    }

    // Handle multiple children
    const childArray = React.Children.toArray(childNodes);
    return childArray
      .map(child => convertToSafeText(child))
      .filter(text => text !== '') // Remove empty strings
      .join('');
  };

  try {
    const safeText = processChildren(children);
    return <Text {...props}>{safeText}</Text>;
  } catch (error) {
    if (debug) {
      console.error('SafeText: Critical error during rendering:', error);
    }
    
    // Fallback rendering
    return (
      <Text {...props} style={[{ color: 'red' }, props.style]}>
        {fallbackText}
      </Text>
    );
  }
};

export default SafeText;
