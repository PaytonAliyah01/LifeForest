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

import { api } from '@/services/api';
import { getUserIdFromToken } from '@/services/authStorage';
import { createRoutine } from '@/services/routinesApi';
import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { appSharedStyles } from '@/components/ui/app-theme';
import { AppTextField } from '@/components/ui/app-text-field';

export default function CreateRoutineScreen() {
  const { width } = useWindowDimensions();
  const descriptionInputRef = useRef<TextInput | null>(null);
  const [tokenUserId, setTokenUserId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [prefillingUserId, setPrefillingUserId] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const horizontalPadding = width < 380 ? 16 : width < 768 ? 24 : 32;
  const cardMaxWidth = width < 768 ? width - horizontalPadding * 2 : 520;

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
            Create Routine
          </ThemedText>
          <ThemedText type="default" style={appSharedStyles.subtitle}>
            Add a new routine for your account.
          </ThemedText>

          <View style={appSharedStyles.form}>
            {prefillingUserId ? (
              <ThemedText style={appSharedStyles.helperText}>Loading account...</ThemedText>
            ) : tokenUserId ? (
              <ThemedText style={appSharedStyles.helperText}>Creating routine as your logged-in account.</ThemedText>
            ) : (
              <ThemedText style={appSharedStyles.errorText}>No login token found. Please log in first.</ThemedText>
            )}

            <AppTextField
              testID="create-routine-title-input"
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => descriptionInputRef.current?.focus()}
            />

            <AppTextField
              ref={descriptionInputRef}
              testID="create-routine-description-input"
              style={styles.textArea}
              placeholder="Description (optional)"
              multiline
              numberOfLines={4}
              multilineHeight={110}
              value={description}
              onChangeText={setDescription}
              returnKeyType="go"
              onSubmitEditing={() => void handleCreateRoutine()}
            />

            <AppButton
              testID="create-routine-submit-button"
              label="Create Routine"
              onPress={handleCreateRoutine}
              loading={loading}
              disabled={loading || prefillingUserId || !tokenUserId}
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
  textArea: {
    minHeight: 110,
  },
  buttonSpacing: {
    marginTop: 6,
  },
});
