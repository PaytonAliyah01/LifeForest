import {useState} from'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, } from 'react-native';
import { isAxiosError } from 'axios';
import {api} from '@/services/api';
import {ThemedText} from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try{
        await api.post('/users', {
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
        <ScrollView contentContainerStyle={styles.scrollContent}>
                    <ThemedView style={styles.card}>
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
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#7A7A7A"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Display name"
              placeholderTextColor="#7A7A7A"
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
    padding: 24,
  },
  card: {
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
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
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