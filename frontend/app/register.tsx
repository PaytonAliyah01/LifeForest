import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View, } from 'react-native';
import { isAxiosError } from 'axios';
import {api} from '@/services/api';
import { register as registerRequest } from '@/services/authApi';
import { getUserIdFromToken } from '@/services/authStorage';
import {ThemedText} from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={24}
    >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
                    <ThemedView style={[styles.card, { maxWidth: cardMaxWidth }]}>
          <ThemedText type="title" style={styles.title}>
            Create account
          </ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            Register a new LifeForest user account.
          </ThemedText>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#7A7A7A"
              keyboardType="email-address"
              returnKeyType="next"
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              blurOnSubmit={false}
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              ref={passwordInputRef}
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#7A7A7A"
              secureTextEntry
              returnKeyType="next"
              onSubmitEditing={() => displayNameInputRef.current?.focus()}
              blurOnSubmit={false}
              value={password}
              onChangeText={setPassword}
            />

            <TextInput
              ref={displayNameInputRef}
              style={styles.input}
              placeholder="Display name"
              placeholderTextColor="#7A7A7A"
              returnKeyType="go"
              onSubmitEditing={() => void handleRegister()}
              value={displayName}
              onChangeText={setDisplayName}
            />

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                  Register
                </ThemedText>
              )}
            </Pressable>

            {successMessage ? (
              <ThemedText style={styles.successText}>{successMessage}</ThemedText>
            ) : null}

            {errorMessage ? (
              <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            ) : null}
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F1B16',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 24,
    paddingBottom: 72,
  },
  card: {
    width: '100%',
    alignSelf: 'center',
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#14251F',
    borderWidth: 1,
    borderColor: '#244338',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: {
    color: '#EAF6F0',
    marginBottom: 8,
  },
  subtitle: {
    color: '#B7CCC2',
    marginBottom: 20,
  },
  form: {
    gap: 14,
  },
  input: {
    backgroundColor: '#20352D',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#355648',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#7EE081',
    borderWidth: 1,
    borderColor: '#A5F0AF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#7EE081',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#102218',
    fontSize: 16,
  },
  successText: {
    color: '#7EE081',
    marginTop: 8,
  },
  errorText: {
    color: '#FF8A8A',
    marginTop: 8,
  },
});
