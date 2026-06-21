import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { isAxiosError } from 'axios';
import { getUserIdFromToken, saveToken } from '@/services/authStorage';

import { api } from '@/services/api';
import { login as loginRequest } from '@/services/authApi';
import { HelloWave } from '@/components/hello-wave';
import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { appSharedStyles } from '@/components/ui/app-theme';
import { AppTextField } from '@/components/ui/app-text-field';

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const passwordInputRef = useRef<TextInput | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const horizontalPadding = width < 380 ? 16 : width < 768 ? 24 : 32;
  const cardMaxWidth = width < 768 ? width - horizontalPadding * 2 : 520;

  useEffect(() => {
    const redirectIfLoggedIn = async () => {
      const userId = await getUserIdFromToken();

      if (userId) {
        router.replace('/(tabs)');
      }
    };

    void redirectIfLoggedIn();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
    const res = await loginRequest({
      email: email.trim(),
      password,
    });

    const token = res.token;
    if (!token) {
      setErrorMessage('Login succeeded but no token was returned.');
      return;
    }

    await saveToken(token);
    setSuccessMessage('Login successful. Redirecting...');

      setEmail('');
      setPassword('');
      router.replace('/(tabs)');
    } catch (error) {
      if (isAxiosError(error)) {
        const data = error.response?.data as
          | {
              error?: string;
              message?: string;
              fields?: Record<string, string>;
            }
          | undefined;

        if (data?.fields) {
          const fieldMessages = Object.entries(data.fields)
            .map(([field, message]) => `${field}: ${message}`)
            .join('\n');
          setErrorMessage(fieldMessages);
        } else if (!error.response) {
          setErrorMessage(`Could not reach the backend at ${api.defaults.baseURL ?? 'the configured API URL'}. Make sure Expo Go and your PC are on the same network.`);
        } else {
          setErrorMessage(data?.error || data?.message || 'Login failed.');
        }
      } else {
        setErrorMessage('Login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={appSharedStyles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={24}
    >
      <ScrollView
        contentContainerStyle={[appSharedStyles.scrollContent, { paddingHorizontal: horizontalPadding }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <AppCard style={{ maxWidth: cardMaxWidth }}>
          <View style={styles.titleRow}>
            <ThemedText type="title" style={appSharedStyles.title}>
              Log in
            </ThemedText>
            <HelloWave />
          </View>
          <ThemedText type="default" style={appSharedStyles.subtitle}>
            Log in to your LifeForest account.
          </ThemedText>

          <View style={appSharedStyles.form}>
            <AppTextField
              testID="login-email-input"
              placeholder="Email"
              keyboardType="email-address"
              returnKeyType="next"
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              blurOnSubmit={false}
              value={email}
              onChangeText={setEmail}
            />

            <AppTextField
              ref={passwordInputRef}
              testID="login-password-input"
              placeholder="Password"
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={() => void handleLogin()}
              value={password}
              onChangeText={setPassword}
            />

            <AppButton
              testID="login-submit-button"
              label="Log in"
              onPress={handleLogin}
              loading={loading}
              style={styles.buttonSpacing}
            />

            {successMessage ? (
              <ThemedText style={appSharedStyles.successText}>{successMessage}</ThemedText>
            ) : null}

            {errorMessage ? (
              <ThemedText style={appSharedStyles.errorText}>{errorMessage}</ThemedText>
            ) : null}
          </View>
        </AppCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  buttonSpacing: {
    marginTop: 6,
  },
});
