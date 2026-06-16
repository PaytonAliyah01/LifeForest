import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
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

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { api } from '@/services/api';
import { getUserIdFromToken } from '@/services/authStorage';
import {
  createReflection,
  getReflectionByFocusSession,
  type Reflection,
} from '@/services/reflectionsApi';

const parseTextParam = (value: string | string[] | undefined): string => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue ?? '';
};

export default function ReflectionScreen() {
  const params = useLocalSearchParams<{
    focusSessionId?: string;
    taskTitle?: string;
    outcome?: string;
  }>();

  const focusSessionId = useMemo(() => Number(params.focusSessionId), [params.focusSessionId]);
  const taskTitle = useMemo(() => parseTextParam(params.taskTitle), [params.taskTitle]);
  const outcome = useMemo(() => parseTextParam(params.outcome), [params.outcome]);

  const [notes, setNotes] = useState('');
  const [focusLevel, setFocusLevel] = useState<number>(3);
  const [distractions, setDistractions] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [savedReflection, setSavedReflection] = useState<Reflection | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const notesInputRef = useRef<TextInput | null>(null);

  const reflectionPrompt = useMemo(() => {
    if (outcome === 'interrupted') {
      return taskTitle
        ? `Your session for "${taskTitle}" was interrupted. Take a moment to capture what pulled you away and what could help next time.`
        : 'Your session was interrupted. Take a moment to capture what pulled you away and what could help next time.';
    }

    if (taskTitle) {
      return `You finished "${taskTitle}". Capture how it went while it is still fresh.`;
    }

    return 'You finished your focus session. Capture how it went while it is still fresh.';
  }, [outcome, taskTitle]);

  const notesPrompt = useMemo(() => {
    if (outcome === 'interrupted') {
      return 'What was getting in the way, and what would make the next attempt easier?';
    }

    return 'What went well, what challenged you, and what do you want to repeat next time?';
  }, [outcome]);

  useEffect(() => {
    const loadExistingReflection = async () => {
      if (!Number.isFinite(focusSessionId)) {
        setErrorMessage('A focus session is required before adding a reflection.');
        setInitialLoading(false);
        return;
      }

      try {
        const reflection = await getReflectionByFocusSession(focusSessionId);

        if (reflection) {
          setSavedReflection(reflection);
          setNotes(reflection.content);
          setFocusLevel(reflection.focusLevel);
          setDistractions(reflection.distractions ?? '');
        }
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          setSavedReflection(null);
        } else if (isAxiosError(error)) {
          const data = error.response?.data as
            | {
                error?: string;
                message?: string;
              }
            | undefined;

          setErrorMessage(data?.error || data?.message || 'Could not load reflection.');
        } else {
          setErrorMessage('Could not load reflection.');
        }
      } finally {
        setInitialLoading(false);
      }
    };

    void loadExistingReflection();
  }, [focusSessionId]);

  const canSave =
    notes.trim().length > 0
    && focusLevel >= 1
    && focusLevel <= 5
    && Number.isFinite(focusSessionId)
    && !savedReflection;

  const handleSaveReflection = async () => {
    if (!Number.isFinite(focusSessionId)) {
      setErrorMessage('A focus session is required before adding a reflection.');
      return;
    }

    if (notes.trim().length === 0) {
      setErrorMessage('Write a few notes before saving your reflection.');
      return;
    }

    if (focusLevel < 1 || focusLevel > 5) {
      setErrorMessage('Choose a focus level between 1 and 5.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const userId = await getUserIdFromToken();

      if (!userId) {
        setErrorMessage('Log in to save a reflection.');
        return;
      }

      const reflection = await createReflection({
        userId,
        focusSessionId,
        content: notes.trim(),
        focusLevel,
        distractions: distractions.trim(),
      });

      setSavedReflection(reflection);
      setNotes(reflection.content);
      setDistractions(reflection.distractions ?? '');
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
          setErrorMessage(
            `Could not reach backend at ${api.defaults.baseURL ?? 'configured API URL'}.`,
          );
        } else {
          setErrorMessage(data?.error || data?.message || 'Could not save reflection.');
        }
      } else {
        setErrorMessage('Could not save reflection.');
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
            Reflection
          </ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            {reflectionPrompt}
          </ThemedText>

          {initialLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color="#7EE081" />
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.infoPanel}>
                <ThemedText type="defaultSemiBold" style={styles.infoLabel}>
                  Notes
                </ThemedText>
                <ThemedText type="default" style={styles.helperText}>
                  {notesPrompt}
                </ThemedText>
              </View>

              <View style={styles.infoPanel}>
                <ThemedText type="defaultSemiBold" style={styles.infoLabel}>
                  Focus rating
                </ThemedText>
                <ThemedText type="default" style={styles.helperText}>
                  Rate how focused you felt during this session from 1 to 5.
                </ThemedText>
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map((level) => {
                    const selected = focusLevel === level;

                    return (
                      <Pressable
                        key={level}
                        style={({ pressed }) => [
                          styles.ratingChip,
                          selected && styles.ratingChipSelected,
                          (savedReflection || loading) && styles.inputDisabled,
                          pressed && styles.buttonPressed,
                        ]}
                        onPress={() => setFocusLevel(level)}
                        disabled={!!savedReflection || loading}
                      >
                        <ThemedText
                          type="defaultSemiBold"
                          style={[
                            styles.ratingChipText,
                            selected && styles.ratingChipTextSelected,
                          ]}
                        >
                          {level}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.infoPanel}>
                <ThemedText type="defaultSemiBold" style={styles.infoLabel}>
                  Distractions
                </ThemedText>
                <ThemedText type="default" style={styles.helperText}>
                  Optionally note what pulled your attention away during the session.
                </ThemedText>
              </View>

              <TextInput
                ref={notesInputRef}
                testID="reflection-notes-input"
                style={[styles.input, styles.textArea, savedReflection && styles.inputDisabled]}
                placeholder={
                  outcome === 'interrupted'
                    ? 'What interrupted you, and what would help next time?'
                    : 'How did this focus session feel?'
                }
                placeholderTextColor="#7A7A7A"
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
                editable={!savedReflection && !loading}
                returnKeyType="done"
                onSubmitEditing={() => void handleSaveReflection()}
              />

              <TextInput
                testID="reflection-distractions-input"
                style={[styles.input, styles.distractionsInput, savedReflection && styles.inputDisabled]}
                placeholder="What distracted you?"
                placeholderTextColor="#7A7A7A"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={distractions}
                onChangeText={setDistractions}
                editable={!savedReflection && !loading}
              />

              {savedReflection ? (
                <View style={styles.savedPanel}>
                  <ThemedText type="defaultSemiBold" style={styles.savedTitle}>
                    Reflection saved
                  </ThemedText>
                  <ThemedText type="default" style={styles.savedText}>
                    Focus rating: {savedReflection.focusLevel}/5
                  </ThemedText>
                  {savedReflection.distractions ? (
                    <ThemedText type="default" style={styles.savedText}>
                      Distractions: {savedReflection.distractions}
                    </ThemedText>
                  ) : null}
                  <ThemedText type="default" style={styles.savedText}>
                    Saved on {new Date(savedReflection.createdAt).toLocaleString()}.
                  </ThemedText>
                </View>
              ) : null}

              <View style={styles.actions}>
                <Pressable
                  testID="reflection-back-button"
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.buttonPressed,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={() => router.back()}
                  disabled={loading}
                >
                  <ThemedText type="defaultSemiBold" style={styles.secondaryButtonText}>
                    Back
                  </ThemedText>
                </Pressable>

                {!savedReflection ? (
                  <Pressable
                    testID="reflection-save-button"
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && styles.buttonPressed,
                      (!canSave || loading) && styles.buttonDisabled,
                    ]}
                    onPress={() => void handleSaveReflection()}
                    disabled={!canSave || loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>
                        Save Reflection
                      </ThemedText>
                    )}
                  </Pressable>
                ) : null}
              </View>

              {errorMessage ? <ThemedText style={styles.errorText}>{errorMessage}</ThemedText> : null}
            </View>
          )}
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
  loadingState: {
    paddingVertical: 24,
  },
  form: {
    gap: 14,
  },
  infoPanel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2B4A3E',
    backgroundColor: '#1A2D26',
    padding: 16,
    gap: 6,
  },
  infoLabel: {
    color: '#EAF6F0',
  },
  helperText: {
    color: '#B7CCC2',
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  ratingChip: {
    minWidth: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#355648',
    backgroundColor: '#20352D',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingChipSelected: {
    borderColor: '#63C174',
    backgroundColor: '#234233',
  },
  ratingChipText: {
    color: '#B7CCC2',
  },
  ratingChipTextSelected: {
    color: '#F3FBF6',
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
    minHeight: 180,
  },
  distractionsInput: {
    minHeight: 110,
  },
  inputDisabled: {
    opacity: 0.82,
  },
  savedPanel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#4FAF7A',
    backgroundColor: '#183427',
    padding: 14,
    gap: 4,
  },
  savedTitle: {
    color: '#EAF6F0',
  },
  savedText: {
    color: '#B7CCC2',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#7EE081',
    borderWidth: 1,
    borderColor: '#A5F0AF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1D3A2E',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4FAF7A',
  },
  primaryButtonText: {
    color: '#102218',
    fontSize: 15,
  },
  secondaryButtonText: {
    color: '#F3FBF6',
    fontSize: 15,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  errorText: {
    color: '#FF8A8A',
    marginTop: 8,
  },
});
