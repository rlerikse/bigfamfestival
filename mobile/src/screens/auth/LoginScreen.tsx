import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { AuthStackParamList } from '../../navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, loginAsGuest, resetPassword } = useAuth();
  const { theme, isDark } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);

  const isValidEmail = (emailStr: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);

  // Clear error when user starts typing
  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    if (error) setError(null);
  }, [error]);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    if (error) setError(null);
  }, [error]);

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await login(email.trim(), password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGuestLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await loginAsGuest();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Guest login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleForgotPassword = () => {
    Alert.prompt(
      'Reset Password',
      'Enter your email address to receive a password reset link.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async (inputEmail) => {
            const emailToReset = (inputEmail || email || '').trim();
            if (!emailToReset) {
              Alert.alert('Email Required', 'Please enter your email address to reset your password.');
              return;
            }
            if (!isValidEmail(emailToReset)) {
              Alert.alert('Invalid Email', 'Please enter a valid email address.');
              return;
            }
            try {
              setIsForgotPasswordLoading(true);
              await resetPassword(emailToReset);
              Alert.alert(
                'Check Your Email',
                `We've sent a password reset link to ${emailToReset}. It may take a few minutes to arrive. Check your spam folder if you don't see it.`,
                [{ text: 'OK' }]
              );
            } catch (err) {
              const msg = err instanceof Error ? err.message : '';
              if (msg.includes('No account found')) {
                Alert.alert('Account Not Found', 'No account exists with that email address. Would you like to create one?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign Up', onPress: () => navigation.navigate('Register') },
                ]);
              } else if (msg.includes('Too many')) {
                Alert.alert('Please Wait', 'Too many reset requests. Please wait a few minutes before trying again.');
              } else {
                Alert.alert('Reset Failed', msg || 'Unable to send reset email. Please try again later.');
              }
            } finally {
              setIsForgotPasswordLoading(false);
            }
          },
        },
      ],
      'plain-text',
      email.trim()
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.titleText, { color: theme.text }]}>
            Big Fam Festival
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.headerText, { color: theme.text }]}>Login</Text>
          
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: `${theme.error || '#FF3B30'}15`, borderColor: `${theme.error || '#FF3B30'}40` }]}>
              <Ionicons name="alert-circle" size={20} color={theme.error || '#FF3B30'} style={{ marginRight: 8 }} />
              <Text style={[styles.errorText, { color: theme.error || '#FF3B30' }]}>{error}</Text>
            </View>
          )}

          <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="mail-outline" size={22} color={theme.muted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email"
              placeholderTextColor={theme.muted}
              value={email}
              onChangeText={handleEmailChange}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="lock-closed-outline" size={22} color={theme.muted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={theme.muted}
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!isPasswordVisible}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
              <Ionicons
                name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={theme.muted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={[styles.forgotPasswordText, { color: theme.muted }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.linkText, { color: theme.primary }]}>
              Don&apos;t have an account? Sign up
            </Text>
          </TouchableOpacity>
          
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.muted }]}>OR</Text>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </View>
          
          <TouchableOpacity
            style={[styles.guestButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={handleGuestLogin}
            disabled={isLoading}
          >
            <Text style={[styles.guestButtonText, { color: theme.text }]}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingCard, { backgroundColor: theme.card }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Signing in...
            </Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 10,
    fontSize: 14,
  },
  guestButton: {
    backgroundColor: '#F2F2F2',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  linkText: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingCard: {
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;
