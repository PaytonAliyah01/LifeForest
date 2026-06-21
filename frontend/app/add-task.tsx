import { useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { isAxiosError } from 'axios';

import { api } from '@/services/api';
import { TaskFormFields } from '@/components/task-form-fields';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { appSharedStyles } from '@/components/ui/app-theme';
import { ThemedText } from '@/components/themed-text';
import { createTask, type RepeatDay, type TaskCategory, type TaskType } from '@/services/tasksApi';

const parseTextParam = (value: string | string[] | undefined): string => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue ?? '';
};

export default function AddTaskScreen() {
  const params = useLocalSearchParams<{
    routineId?: string;
    routineTitle?: string;
  }>();

  const routineId = useMemo(() => Number(params.routineId), [params.routineId]);
  const routineTitle = useMemo(() => parseTextParam(params.routineTitle), [params.routineTitle]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState<TaskCategory>('GENERAL');
  const [taskType, setTaskType] = useState<TaskType>('ONE_TIME');
  const [repeatDays, setRepeatDays] = useState<RepeatDay[]>([]);
  const [preferredTime, setPreferredTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const descriptionInputRef = useRef<TextInput | null>(null);
  const durationInputRef = useRef<TextInput | null>(null);

  const canCreate = Number.isFinite(routineId) && title.trim().length > 0;

  const handleCreateTask = async () => {
    if (!canCreate) {
      setErrorMessage('Task title cannot be empty.');
      return;
    }

    const parsedDuration =
      duration.trim().length === 0 ? null : Number.parseInt(duration.trim(), 10);

    if (
      duration.trim().length > 0 &&
      (parsedDuration === null || !Number.isFinite(parsedDuration) || parsedDuration < 0)
    ) {
      setErrorMessage('Duration must be a whole number of minutes.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await createTask({
        routineId,
        task: {
          title: title.trim(),
          description: description.trim() || null,
          duration: parsedDuration,
          category,
          taskType,
          repeatDays: taskType === 'REPEATING' ? repeatDays : [],
          preferredTime: taskType === 'REPEATING' ? preferredTime.trim() || null : null,
        },
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
        } else if (!error.response) {
          setErrorMessage(
            `Could not reach backend at ${api.defaults.baseURL ?? 'configured API URL'}.`,
          );
        } else {
          setErrorMessage(data?.error || data?.message || 'Task creation failed.');
        }
      } else {
        setErrorMessage('Task creation failed.');
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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <AppCard style={styles.card}>
          <ThemedText type="title" style={appSharedStyles.title}>
            Add Task
          </ThemedText>
          <ThemedText type="default" style={appSharedStyles.subtitle}>
            {routineTitle
              ? `Create a task for "${routineTitle}".`
              : 'Create a task for this routine.'}
          </ThemedText>

          <View style={appSharedStyles.form}>
            <TaskFormFields
              title={title}
              onChangeTitle={setTitle}
              description={description}
              onChangeDescription={setDescription}
              duration={duration}
              onChangeDuration={setDuration}
              category={category}
              onChangeCategory={setCategory}
              taskType={taskType}
              onChangeTaskType={setTaskType}
              repeatDays={repeatDays}
              onChangeRepeatDays={setRepeatDays}
              preferredTime={preferredTime}
              onChangePreferredTime={setPreferredTime}
              onSubmit={handleCreateTask}
              descriptionInputRef={descriptionInputRef}
              durationInputRef={durationInputRef}
              titleTestID="add-task-title-input"
              descriptionTestID="add-task-description-input"
              durationTestID="add-task-duration-input"
            />

            <View style={styles.actions}>
              <AppButton
                label="Cancel"
                variant="secondary"
                onPress={() => router.back()}
                disabled={loading}
                style={styles.actionButton}
              />

              <AppButton
                testID="add-task-submit-button"
                label="Create Task"
                onPress={() => void handleCreateTask()}
                loading={loading}
                disabled={!canCreate || loading}
                style={styles.actionButton}
              />
            </View>

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
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  actionButton: {
    flex: 1,
  },
});
