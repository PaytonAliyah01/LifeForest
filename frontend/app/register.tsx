import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, useWindowDimensions, View, } from 'react-native';
import { isAxiosError } from 'axios';
import {api} from '@/services/api';
import { register as registerRequest } from '@/services/authApi';
import { getUserIdFromToken } from '@/services/authStorage';
import {ThemedText} from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { appSharedStyles } from '@/components/ui/app-theme';
import { AppTextField } from '@/components/ui/app-text-field';
import { router } from 'expo-router';

export default function RegisterScreen() {
  const { width } = useWindowDimensions();
  const passwordInputRef = useRef<TextInput | null>(null);
  const displayNameInputRef = useRef<TextInput | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
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

  const handleRegister = async () => {
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try{
      await registerRequest({
            email: email.trim(),
            password,
            displayName: displayName.trim(),
        });

        setSuccessMessage('Account created successfully.');
        setEmail('');
        setPassword('');
        setDisplayName('');
    } catch (error) {
        if (isAxiosError(error)) {
        const data = error.response?.data as 
        {
            error?: string;
            message?: string;
            fields?: Record<string, string>;
        }

        if (data?.fields){
            const fieldMessages = Object.entries(data.fields)
            .map(([field, message]) => `${field}: ${message}`)
            .join('\n');
            setErrorMessage(fieldMessages);
        } else if (error.response === undefined) {
          setErrorMessage(`Could not reach the backend at ${api.defaults.baseURL ?? 'the configured API URL'}. Make sure Expo Go and your PC are on the same network, then restart Expo.`);
        } else {
            setErrorMessage(data?.error || data?.message || 'Registration failed.');
        }
    } else {
        setErrorMessage('Registration failed.');
    }
  }finally{
    setLoading(false);
  }
  };
  return(
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
          <ThemedText type="title" style={appSharedStyles.title}>
            Create account
          </ThemedText>
          <ThemedText type="default" style={appSharedStyles.subtitle}>
            Register a new LifeForest user account.
          </ThemedText>

          <View style={appSharedStyles.form}>
            <AppTextField
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
              placeholder="Password"
              secureTextEntry
              returnKeyType="next"
              onSubmitEditing={() => displayNameInputRef.current?.focus()}
              blurOnSubmit={false}
              value={password}
              onChangeText={setPassword}
            />

            <AppTextField
              ref={displayNameInputRef}
              placeholder="Display name"
              returnKeyType="go"
              onSubmitEditing={() => void handleRegister()}
              value={displayName}
              onChangeText={setDisplayName}
            />

            <AppButton
              label="Register"
              onPress={handleRegister}
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
  buttonSpacing: {
    marginTop: 6,
  },
});
