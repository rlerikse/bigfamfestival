// SafeText component tests
// Created: 2025-06-03
// Purpose: Ensure SafeText prevents text rendering errors

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import SafeText from '../components/SafeText';

describe('SafeText Component', () => {
  it('renders string children correctly', () => {
    const { getByText } = render(
      <SafeText>Hello World</SafeText>
    );
    
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('renders number children correctly', () => {
    const { getByText } = render(
      <SafeText>{123}</SafeText>
    );
    
    expect(getByText('123')).toBeTruthy();
  });

  it('handles null children gracefully', () => {
    const component = render(
      <SafeText>{null}</SafeText>
    );
    
    // Should render empty Text component
    expect(component.UNSAFE_root).toBeTruthy();
  });

  it('handles undefined children gracefully', () => {
    const component = render(
      <SafeText>{undefined}</SafeText>
    );
    
    expect(component.UNSAFE_root).toBeTruthy();
  });

  it('converts React elements to string representation', () => {
    const { getByText } = render(
      <SafeText>
        <View />
      </SafeText>
    );
    
    expect(getByText('[View]')).toBeTruthy();
  });

  it('allows nested Text components', () => {
    const { getByText } = render(
      <SafeText>
        <Text>Nested text</Text>
      </SafeText>
    );
    
    expect(getByText('Nested text')).toBeTruthy();
  });

  it('converts arrays to comma-separated strings', () => {
    const { getByText } = render(
      <SafeText>{['item1', 'item2', 'item3']}</SafeText>
    );
    
    expect(getByText('item1, item2, item3')).toBeTruthy();
  });

  it('converts objects to JSON strings', () => {
    const testObj = { name: 'test', value: 123 };
    const { getByText } = render(
      <SafeText>{testObj as unknown as React.ReactNode}</SafeText>
    );
    
    expect(getByText('{"name":"test","value":123}')).toBeTruthy();
  });

  it('converts booleans to strings', () => {
    const { getByText } = render(
      <SafeText>{true}</SafeText>
    );
    
    expect(getByText('true')).toBeTruthy();
  });

  it('applies custom styles correctly', () => {
    const customStyle = { color: 'blue', fontSize: 20 };
    const { getByText } = render(
      <SafeText style={customStyle}>Styled text</SafeText>
    );
    
    const textElement = getByText('Styled text');
    expect(textElement.props.style).toEqual(expect.objectContaining(customStyle));
  });

  it('shows fallback text on critical error', () => {
    // Mock console.error to avoid noise in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Force an error by passing a malformed object that will fail processing
    const malformedChild = {
      toString: () => {
        throw new Error('Conversion error');
      }
    };
    
    const { getByText } = render(
      <SafeText fallbackText="Error occurred">
        {malformedChild as unknown as React.ReactNode}
      </SafeText>
    );
    
    expect(getByText('Error occurred')).toBeTruthy();
    
    consoleSpy.mockRestore();
  });

  it('handles mixed content types', () => {
    const { getByText } = render(
      <SafeText>
        Text content
        {123}
        {null}
        {true}
      </SafeText>
    );
    
    // Should concatenate all valid content
    const textElement = getByText(/Text content/);
    expect(textElement).toBeTruthy();
  });

  it('forwards additional Text props correctly', () => {
    const { getByText } = render(
      <SafeText numberOfLines={2} ellipsizeMode="tail">
        Long text content
      </SafeText>
    );
    
    const textElement = getByText('Long text content');
    expect(textElement.props.numberOfLines).toBe(2);
    expect(textElement.props.ellipsizeMode).toBe('tail');
  });
});
