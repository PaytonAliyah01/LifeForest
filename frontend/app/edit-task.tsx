import { useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { isAxiosError } from 'axios';

import { ThemedText } from '@/components/themed-text';
import { TaskFormFields } from '@/components/task-form-fields';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { appColors, appSharedStyles } from '@/components/ui/app-theme';
import { InfoPanel } from '@/components/ui/info-panel';
import {
  deleteTaskById,
  updateTaskById,
  type RepeatDay,
  type TaskCategory,
  type TaskType,
} from '@/services/tasksApi';

const parseTextParam = (value: string | string[] | undefined): string => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue ?? '';
};

const parseCompletedParam = (value: string | string[] | undefined): boolean => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue === 'true';
};

const parseCategoryParam = (value: string | string[] | undefined): TaskCategory => {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (
    rawValue === 'WORK' ||
    rawValue === 'STUDY' ||
    rawValue === 'HEALTH' ||
    rawValue === 'CREATIVE'
  ) {
    return rawValue;
  }

  return 'GENERAL';
};

const parseTaskTypeParam = (value: string | string[] | undefined): TaskType => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue === 'REPEATING' ? 'REPEATING' : 'ONE_TIME';
};

const parseRepeatDaysParam = (value: string | string[] | undefined): RepeatDay[] => {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(',')
    .filter(
      (day): day is RepeatDay =>
        day === 'MONDAY' ||
        day === 'TUESDAY' ||
        day === 'WEDNESDAY' ||
        day === 'THURSDAY' ||
        day === 'FRIDAY' ||
        day === 'SATURDAY' ||
        day === 'SUNDAY',
    );
};

export default function EditTaskScreen() {
  const params = useLocalSearchParams<{
    taskId?: string;
    routineId?: string;
    title?: string;
    description?: string;
    duration?: string;
    category?: string;
    taskType?: string;
    repeatDays?: string;
    preferredTime?: string;
    completed?: string;
  }>();

  const taskId = useMemo(() => Number(params.taskId), [params.taskId]);
  const routineId = useMemo(() => Number(params.routineId), [params.routineId]);
  const initialTitle = useMemo(() => parseTextParam(params.title), [params.title]);
  const initialDescription = useMemo(() => parseTextParam(params.description), [params.description]);
  const initialDuration = useMemo(() => parseTextParam(params.duration), [params.duration]);
  const initialCategory = useMemo(() => parseCategoryParam(params.category), [params.category]);
  const initialTaskType = useMemo(() => parseTaskTypeParam(params.taskType), [params.taskType]);
  const initialRepeatDays = useMemo(() => parseRepeatDaysParam(params.repeatDays), [params.repeatDays]);
  const initialPreferredTime = useMemo(() => parseTextParam(params.preferredTime), [params.preferredTime]);
  const initialCompleted = useMemo(() => parseCompletedParam(params.completed), [params.completed]);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [duration, setDuration] = useState(initialDuration);
  const [category, setCategory] = useState<TaskCategory>(initialCategory);
  const [taskType, setTaskType] = useState<TaskType>(initialTaskType);
  const [repeatDays, setRepeatDays] = useState<RepeatDay[]>(initialRepeatDays);
  const [preferredTime, setPreferredTime] = useState(initialPreferredTime);
  const [completed] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const descriptionInputRef = useRef<TextInput | null>(null);
  const durationInputRef = useRef<TextInput | null>(null);

  const canSave =
    Number.isFinite(taskId) && Number.isFinite(routineId) && title.trim().length > 0;

  const handleStartFocusSession = () => {
    router.push({
      pathname: '/focus-session',
      params: {
        taskId: Number.isFinite(taskId) ? String(taskId) : '',
        taskTitle: title.trim() || initialTitle,
        taskDuration: duration.trim(),
      },
    } as never);
  };

  const handleSave = async () => {
    if (!canSave) {
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
      await updateTaskById(routineId, taskId, {
        title: title.trim(),
        description: description.trim() || null,
        duration: parsedDuration,
        category,
        taskType,
        repeatDays: taskType === 'REPEATING' ? repeatDays : [],
        preferredTime: taskType === 'REPEATING' ? preferredTime.trim() || null : null,
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
          setErrorMessage(data?.error || data?.message || 'Task update failed.');
        }
      } else {
        setErrorMessage('Task update failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!Number.isFinite(taskId) || !Number.isFinite(routineId)) {
      setErrorMessage('This task could not be deleted because its IDs are invalid.');
      return;
    }

    setDeleting(true);
    setErrorMessage('');

    try {
      await deleteTaskById(routineId, taskId);
      router.back();
    } catch (error) {
      if (isAxiosError(error)) {
        const data = error.response?.data as
          | {
              error?: string;
              message?: string;
            }
          | undefined;

        setErrorMessage(data?.error || data?.message || 'Task deletion failed.');
      } else {
        setErrorMessage('Task deletion failed.');
      }
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete task?',
      'This will permanently remove this task. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
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
            Edit Task
          </ThemedText>
          <ThemedText type="default" style={appSharedStyles.subtitle}>
            Update the details for this task.
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
              onSubmit={handleSave}
              descriptionInputRef={descriptionInputRef}
              durationInputRef={durationInputRef}
            />

            <InfoPanel
              title="Task status"
              helper={
                taskType === 'REPEATING'
                  ? 'Repeating tasks stay available after each completed session.'
                  : completed
                    ? 'This one-time task was completed by a finished focus session.'
                    : 'This one-time task will complete automatically after a finished focus session.'
              }
            >
              <View style={styles.switchRow}>
                <View style={styles.switchLabelGroup}>
                  <ThemedText type="defaultSemiBold" style={styles.switchLabel}>
                    Availability
                  </ThemedText>
                  <ThemedText style={appSharedStyles.helperText}>
                    {completed ? 'The task is complete.' : 'The task is still ready for focus.'}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    completed ? styles.statusPillDone : styles.statusPillOpen,
                  ]}
                >
                  <ThemedText
                    type="defaultSemiBold"
                    style={[
                      styles.statusPillText,
                      completed ? styles.statusPillTextDone : styles.statusPillTextOpen,
                    ]}
                  >
                    {completed ? 'Completed' : taskType === 'REPEATING' ? 'Repeating' : 'Open'}
                  </ThemedText>
                </View>
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
              label="Start Focus Session"
              variant="secondary"
              onPress={handleStartFocusSession}
              disabled={loading || deleting}
              style={styles.focusButton}
            />

            <AppButton
              label="Delete Task"
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
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, backgroundColor: 'transparent' },
  switchLabelGroup: {
    flex: 1,
    gap: 4,
    backgroundColor: 'transparent',
  },
  switchLabel: {
    color: appColors.text,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  statusPillOpen: {
    backgroundColor: appColors.greenPanel,
    borderColor: appColors.secondaryBorder,
  },
  statusPillDone: {
    backgroundColor: appColors.bluePanel,
    borderColor: appColors.blueBorder,
  },
  statusPillText: {
    fontSize: 12,
  },
  statusPillTextOpen: {
    color: appColors.greenText,
  },
  statusPillTextDone: {
    color: appColors.blueText,
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
  focusButton: {
    backgroundColor: '#285543',
    borderColor: appColors.secondaryBorder,
    marginTop: 4,
  },
});
