import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { isAxiosError } from 'axios';

import { api } from '@/services/api';
import { getUserIdFromToken } from '@/services/authStorage';
import { createRoutine } from '@/services/routinesApi';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function CreateRoutineScreen() {
  const descriptionInputRef = useRef<TextInput | null>(null);
  const [tokenUserId, setTokenUserId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [prefillingUserId, setPrefillingUserId] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const prefillUserId = async () => {
      try {
        const resolvedUserId = await getUserIdFromToken();
        if (resolvedUserId) {
          setTokenUserId(resolvedUserId);
        }
      } finally {
        setPrefillingUserId(false);
      }
    };

    prefillUserId();
  }, []);

  const handleCreateRoutine = async () => {
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    if (!tokenUserId) {
      setLoading(false);
      setErrorMessage('You must be logged in to create a routine.');
      return;
    }

    try {
      const response = await createRoutine({
        userId: tokenUserId,
        routine: {
          title: title.trim(),
          description: description.trim() || null,
        },
      });

      setSuccessMessage(`Routine created (ID: ${response.id}).`);
      setTitle('');
      setDescription('');
      router.back();
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
          setErrorMessage(`Could not reach backend at ${api.defaults.baseURL ?? 'configured API URL'}.`);
        } else {
          setErrorMessage(data?.error || data?.message || 'Routine creation failed.');
        }
      } else {
        setErrorMessage('Routine creation failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={24}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <ThemedView style={styles.card}>
          <ThemedText type="title" style={styles.title}>
            Create Routine
          </ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            Add a new routine for your account.
          </ThemedText>

          <View style={styles.form}>
            {prefillingUserId ? (
              <ThemedText style={styles.helperText}>Loading account...</ThemedText>
            ) : tokenUserId ? (
              <ThemedText style={styles.helperText}>Creating routine as your logged-in account.</ThemedText>
            ) : (
              <ThemedText style={styles.errorText}>No login token found. Please log in first.</ThemedText>
            )}

            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor="#7A7A7A"
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => descriptionInputRef.current?.focus()}
            />

            <TextInput
              ref={descriptionInputRef}
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor="#7A7A7A"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
              returnKeyType="go"
              onSubmitEditing={() => void handleCreateRoutine()}
            />

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                (loading || prefillingUserId || !tokenUserId) && styles.buttonDisabled,
              ]}
              onPress={handleCreateRoutine}
              disabled={loading || prefillingUserId || !tokenUserId}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                  Create Routine
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
    paddingHorizontal: 24,
    paddingBottom: 72,
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
  textArea: {
    minHeight: 110,
  },
  helperText: {
    color: '#98B7A7',
    marginTop: -6,
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
