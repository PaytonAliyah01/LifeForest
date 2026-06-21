import { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { isAxiosError } from 'axios';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppTextField } from '@/components/ui/app-text-field';
import { appColors, appSharedStyles } from '@/components/ui/app-theme';
import { InfoPanel } from '@/components/ui/info-panel';
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
      style={appSharedStyles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={24}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <AppCard style={styles.card}>
          <ThemedText type="title" style={appSharedStyles.title}>
            Edit Routine
          </ThemedText>
          <ThemedText type="default" style={appSharedStyles.subtitle}>
            Update the details for this routine.
          </ThemedText>

          <View style={appSharedStyles.form}>
            <AppTextField
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
            />

            <AppTextField
              style={styles.textArea}
              placeholder="Description (optional)"
              multiline
              numberOfLines={4}
              multilineHeight={110}
              value={description}
              onChangeText={setDescription}
            />

            <InfoPanel
              title="Mark as completed"
              helper="Toggle this when the routine is finished."
            >
              <View style={styles.switchRow}>
              <View style={styles.switchLabelGroup}>
                <ThemedText type="defaultSemiBold" style={styles.switchLabel}>
                  Status
                </ThemedText>
                <ThemedText style={appSharedStyles.helperText}>
                  {completed ? 'This routine is marked complete.' : 'This routine is still active.'}
                </ThemedText>
              </View>
              <Switch
                value={completed}
                onValueChange={setCompleted}
                trackColor={{ false: '#49635A', true: appColors.selectedPanelBorder }}
                thumbColor="#FFFFFF"
              />
              </View>
            </InfoPanel>

            <View style={styles.actions}>
              <AppButton
                label="Cancel"
                variant="secondary"
                onPress={() => router.back()}
                disabled={loading || deleting}
                style={styles.actionButton}
              />

              <AppButton
                label="Save Changes"
                onPress={() => void handleSave()}
                loading={loading}
                disabled={!canSave || loading || deleting}
                style={styles.actionButton}
              />
            </View>

            <AppButton
              label="Add Task"
              variant="secondary"
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
            />

            <AppButton
              label="Delete Routine"
              onPress={confirmDelete}
              loading={deleting}
              disabled={loading || deleting}
              style={styles.deleteButton}
            />

            {errorMessage ? <ThemedText style={appSharedStyles.errorText}>{errorMessage}</ThemedText> : null}
          </View>
        </AppCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    ...appSharedStyles.scrollContent,
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  card: {},
  input: {
  },
  textArea: {
    minHeight: 110,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    backgroundColor: 'transparent',
  },
  switchLabelGroup: {
    flex: 1,
    gap: 4,
    backgroundColor: 'transparent',
  },
  switchLabel: {
    color: appColors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    backgroundColor: 'transparent',
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: appColors.danger,
    borderColor: appColors.dangerBorder,
    marginTop: 4,
  },
});
