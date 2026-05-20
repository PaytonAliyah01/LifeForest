import { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { isAxiosError } from 'axios';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { deleteRoutineById, updateRoutineById } from '@/services/routinesApi';

const parseCompletedParam = (value: string | string[] | undefined): boolean => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue === 'true';
};

const parseTextParam = (value: string | string[] | undefined): string => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue ?? '';
};

export default function EditRoutineScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    description?: string;
    completed?: string;
  }>();

  const routineId = useMemo(() => Number(params.id), [params.id]);
  const initialTitle = useMemo(() => parseTextParam(params.title), [params.title]);
  const initialDescription = useMemo(
    () => parseTextParam(params.description),
    [params.description],
  );
  const initialCompleted = useMemo(
    () => parseCompletedParam(params.completed),
    [params.completed],
  );

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const canSave = Number.isFinite(routineId) && title.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) {
      setErrorMessage('Routine title cannot be empty.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await updateRoutineById(routineId, {
        title: title.trim(),
        description: description.trim() || null,
        completed,
      });

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
        } else {
          setErrorMessage(data?.error || data?.message || 'Routine update failed.');
        }
      } else {
        setErrorMessage('Routine update failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!Number.isFinite(routineId)) {
      setErrorMessage('This routine could not be deleted because its ID is invalid.');
      return;
    }

    setDeleting(true);
    setErrorMessage('');

    try {
      await deleteRoutineById(routineId);
      router.back();
    } catch (error) {
      if (isAxiosError(error)) {
        const data = error.response?.data as
          | {
              error?: string;
              message?: string;
            }
          | undefined;

        setErrorMessage(data?.error || data?.message || 'Routine deletion failed.');
      } else {
        setErrorMessage('Routine deletion failed.');
      }
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete routine?',
      'This will permanently remove this routine. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void handleDelete();
          },
        },
      ],
    );
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
            Edit Routine
          </ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            Update the details for this routine.
          </ThemedText>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor="#7A7A7A"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor="#7A7A7A"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />

            <ThemedView style={styles.switchRow}>
              <View style={styles.switchLabelGroup}>
                <ThemedText type="defaultSemiBold" style={styles.switchLabel}>
                  Mark as completed
                </ThemedText>
                <ThemedText style={styles.helperText}>
                  Toggle this when the routine is finished.
                </ThemedText>
              </View>
              <Switch
                value={completed}
                onValueChange={setCompleted}
                trackColor={{ false: '#49635A', true: '#63C174' }}
                thumbColor="#FFFFFF"
              />
            </ThemedView>

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                  (loading || deleting) && styles.buttonDisabled,
                ]}
                onPress={() => router.back()}
                disabled={loading || deleting}
              >
                <ThemedText type="defaultSemiBold" style={styles.secondaryButtonText}>
                  Cancel
                </ThemedText>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                  (!canSave || loading || deleting) && styles.buttonDisabled,
                ]}
                onPress={() => void handleSave()}
                disabled={!canSave || loading || deleting}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>
                    Save Changes
                  </ThemedText>
                )}
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
                (loading || deleting) && styles.buttonDisabled,
              ]}
              onPress={() =>
                router.push({
                  pathname: '/add-task',
                  params: {
                    routineId: String(routineId),
                    routineTitle: title.trim() || initialTitle,
                  },
                })
              }
              disabled={loading || deleting}
            >
              <ThemedText type="defaultSemiBold" style={styles.secondaryButtonText}>
                Add Task
              </ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.buttonPressed,
                (loading || deleting) && styles.buttonDisabled,
              ]}
              onPress={confirmDelete}
              disabled={loading || deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText type="defaultSemiBold" style={styles.deleteButtonText}>
                  Delete Routine
                </ThemedText>
              )}
            </Pressable>

            {errorMessage ? <ThemedText style={styles.errorText}>{errorMessage}</ThemedText> : null}
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    backgroundColor: '#1A2D26',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2B4A3E',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  switchLabelGroup: {
    flex: 1,
    gap: 4,
    backgroundColor: 'transparent',
  },
  switchLabel: {
    color: '#EAF6F0',
  },
  helperText: {
    color: '#98B7A7',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    backgroundColor: 'transparent',
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
  deleteButton: {
    backgroundColor: '#B94A4A',
    borderWidth: 1,
    borderColor: '#E28787',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  deleteButtonText: {
    color: '#FFFFFF',
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
