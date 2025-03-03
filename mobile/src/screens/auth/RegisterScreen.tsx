import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { AuthStackParamList } from '../../navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register } = useAuth();
  const { theme, isDark } = useTheme();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await register(name, email, password, phone || undefined);
    } catch (error) {
      // Error is handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerText, { color: theme.text }]}>Create Account</Text>
        </View>

        <View style={styles.formContainer}>
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="person-outline" size={22} color={theme.muted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Full Name"
              placeholderTextColor={theme.muted}
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="mail-outline" size={22} color={theme.muted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email"
              placeholderTextColor={theme.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="call-outline" size={22} color={theme.muted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Phone (Optional)"
              placeholderTextColor={theme.muted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
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
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
              returnKeyType="next"
            />
            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
              <Ionicons
                name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={theme.muted}
              />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="lock-closed-outline" size={22} color={theme.muted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Confirm Password"
              placeholderTextColor={theme.muted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!isPasswordVisible}
              returnKeyType="done"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.linkText, { color: theme.primary }]}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 32,
  },
  backButton: {
    marginRight: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
  },
  errorText: {
    color: '#FF0000',
    marginBottom: 16,
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
    marginBottom: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default RegisterScreen;
