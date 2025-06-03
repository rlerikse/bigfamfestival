import { Alert, Platform } from 'react-native';

/**
 * A wrapper around React Native's Alert API to ensure consistent behavior across the app.
 * Use this instead of the global 'alert' function to prevent "Text strings must be 
 * rendered within a <Text> component" errors.
 * 
 * @param title The title of the alert
 * @param message The message to display in the alert
 * @param buttons Array of button configurations (optional)
 * @param options Additional options (optional)
 */
export const showAlert = (
  title: string,
  message?: string,
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>,
  options?: {
    cancelable?: boolean;
    onDismiss?: () => void;
  }
) => {
  // Default buttons if none provided
  const defaultButtons = [{ text: 'OK' }];
  
  Alert.alert(
    title,
    message,
    buttons || defaultButtons,
    options
  );
};

/**
 * Shows a simple alert with just a title and message
 * 
 * @param title The title of the alert
 * @param message The message to display in the alert
 */
export const showSimpleAlert = (title: string, message?: string) => {
  showAlert(title, message);
};

/**
 * Shows a confirmation dialog with OK and Cancel buttons
 * 
 * @param title The title of the alert
 * @param message The message to display in the alert
 * @param onConfirm Callback when OK is pressed
 * @param onCancel Callback when Cancel is pressed (optional)
 */
export const showConfirmationAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  showAlert(
    title,
    message,
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'OK',
        onPress: onConfirm,
      },
    ]
  );
};
