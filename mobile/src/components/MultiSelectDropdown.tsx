// Commit: Add reusable MultiSelectDropdown component for stage filtering
// Author: GitHub Copilot, 2025-01-07

/**
 * MultiSelectDropdown
 * A reusable dropdown component that allows multiple selections
 * with checkboxes and a customizable appearance.
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Pressable,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface Option {
  id: string;
  label: string;
  value: string;
}

interface MultiSelectDropdownProps {
  options: Option[];
  selectedValues: string[];
  onSelectionChange: (selectedValues: string[]) => void;
  placeholder?: string;
  maxDisplayCount?: number;
  style?: ViewStyle;
  disabled?: boolean;
  allOptionValue?: string; // Value that represents "all" option (e.g., "all")
  icon?: string; // Optional icon name from Ionicons
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = 'Select options',
  maxDisplayCount = 2,
  style,
  disabled = false,
  allOptionValue = 'all', // Default "all" option value
  icon,
}) => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<View>(null);

  const toggleOption = (value: string) => {
    if (value === allOptionValue) {
      // If "All" is clicked
      if (selectedValues.includes(allOptionValue)) {
        // If "All" is already selected, deselect it (but ensure we have at least one selection)
        const nonAllOptions = options.filter(opt => opt.value !== allOptionValue);
        if (nonAllOptions.length > 0) {
          // Select the first non-all option as default
          onSelectionChange([nonAllOptions[0].value]);
        } else {
          // If there are no other options, keep "All" selected
          onSelectionChange([allOptionValue]);
        }
      } else {
        // If "All" is not selected, select only "All" and deselect everything else
        onSelectionChange([allOptionValue]);
      }
    } else {
      // If any specific option is clicked
      let newValues: string[];
      
      if (selectedValues.includes(value)) {
        // If the option is already selected, remove it
        newValues = selectedValues.filter(v => v !== value && v !== allOptionValue);
      } else {
        // If the option is not selected, add it and remove "All"
        newValues = [...selectedValues.filter(v => v !== allOptionValue), value];
      }
      
      // If after filtering there are no specific selections, default to "All"
      if (newValues.length === 0) {
        newValues = [allOptionValue];
      }
      
      onSelectionChange(newValues);
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    } else if (selectedValues.includes(allOptionValue)) {
      // If "All" is selected, show the "All" option label
      const allOption = options.find(opt => opt.value === allOptionValue);
      return allOption?.label || placeholder;
    } else if (selectedValues.length === 1) {
      const option = options.find(opt => opt.value === selectedValues[0]);
      return option?.label || selectedValues[0];
    } else if (selectedValues.length <= maxDisplayCount) {
      return selectedValues
        .map(value => options.find(opt => opt.value === value)?.label || value)
        .join(', ');
    } else {
      return `${selectedValues.length} selected`;
    }
  };

  const openDropdown = () => {
    if (disabled) return;
    
    buttonRef.current?.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
      const screenHeight = Dimensions.get('window').height;
      const dropdownHeight = Math.min(options.length * 50 + 20, screenHeight * 0.5);
      
      let top = py + height - 35; // Moved up by 30px more (from -5 to -35)
      
      // Adjust if dropdown would go off screen
      if (top + dropdownHeight > screenHeight - 50) {
        top = py - dropdownHeight - 45; // Also moved up by 30px more (from -15 to -45)
      }
      
      setDropdownPosition({
        top,
        left: px,
        width: width,
      });
      setIsVisible(true);
    });
  };

  const renderOption = ({ item }: { item: Option }) => {
    const isSelected = selectedValues.includes(item.value);
    
    return (
      <TouchableOpacity
        style={[
          styles.optionItem,
          {
            backgroundColor: isSelected ? theme.primary + '15' : 'transparent',
            borderBottomColor: theme.border,
          }
        ]}
        onPress={() => toggleOption(item.value)}
      >
        <View style={styles.checkboxContainer}>
          <View
            style={[
              styles.checkbox,
              {
                borderColor: theme.border,
                backgroundColor: isSelected ? theme.primary : 'transparent',
              }
            ]}
          >
            {isSelected && (
              <Ionicons name="checkmark" size={16} color={theme.background} />
            )}
          </View>
        </View>
        <Text style={[styles.optionText, { color: theme.text }]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        ref={buttonRef}
        style={[
          styles.dropdownButton,
          {
            borderColor: theme.border,
            backgroundColor: theme.background,
            opacity: disabled ? 0.6 : 1,
          },
          style
        ]}
        onPress={openDropdown}
        disabled={disabled}
      >
        {icon && (
          <Ionicons
            name={icon as any}
            size={16}
            color={theme.text}
            style={{ marginRight: 8 }}
          />
        )}
        <Text
          style={[
            styles.dropdownButtonText,
            {
              color: selectedValues.length > 0 ? theme.text : theme.muted,
              flex: 1,
            }
          ]}
          numberOfLines={1}
        >
          {getDisplayText()}
        </Text>
        <Ionicons
          name={isVisible ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.text}
        />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsVisible(false)}
        >
          <View
            style={[
              styles.dropdownContainer,
              {
                position: 'absolute',
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                backgroundColor: theme.background,
                borderColor: theme.border,
                shadowColor: theme.text,
              }
            ]}
          >
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={styles.optionsList}
              bounces={false}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dropdownContainer: {
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 300,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  optionsList: {
    maxHeight: 280,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  checkboxContainer: {
    marginRight: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});

export default MultiSelectDropdown;
