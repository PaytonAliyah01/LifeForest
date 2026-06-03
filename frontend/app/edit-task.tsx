import { useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
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
import {
  deleteTaskById,
  updateTaskById,
  type RepeatDay,
  type TaskCategory,
  type TaskType,
} from '@/services/tasksApi';

const TASK_CATEGORY_OPTIONS: Array<{ value: TaskCategory; label: string }> = [
  { value: 'GENERAL', label: 'General' },
  { value: 'WORK', label: 'Work' },
  { value: 'STUDY', label: 'Study' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'CREATIVE', label: 'Creative' },
];

const TASK_TYPE_OPTIONS: Array<{ value: TaskType; label: string; helper: string }> = [
  {
    value: 'ONE_TIME',
    label: 'One-time',
    helper: 'Finishes after one completed focus session.',
  },
  {
    value: 'REPEATING',
    label: 'Repeating',
    helper: 'Stays available and can grow a new tree each time.',
  },
];

const REPEAT_DAY_OPTIONS: Array<{ value: RepeatDay; label: string }> = [
  { value: 'MONDAY', label: 'Mon' },
  { value: 'TUESDAY', label: 'Tue' },
  { value: 'WEDNESDAY', label: 'Wed' },
  { value: 'THURSDAY', label: 'Thu' },
  { value: 'FRIDAY', label: 'Fri' },
  { value: 'SATURDAY', label: 'Sat' },
  { value: 'SUNDAY', label: 'Sun' },
];

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
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const descriptionInputRef = useRef<TextInput | null>(null);
  const durationInputRef = useRef<TextInput | null>(null);

  const canSave =
    Number.isFinite(taskId) && Number.isFinite(routineId) && title.trim().length > 0;

  const toggleRepeatDay = (day: RepeatDay) => {
    setRepeatDays((currentDays) =>
      currentDays.includes(day)
        ? currentDays.filter((currentDay) => currentDay !== day)
        : [...currentDays, day],
    );
  };

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
            Edit Task
          </ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            Update the details for this task.
          </ThemedText>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Task title"
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
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => durationInputRef.current?.focus()}
            />

            <TextInput
              ref={durationInputRef}
              style={styles.input}
              placeholder="Duration in minutes (optional)"
              placeholderTextColor="#7A7A7A"
              keyboardType="number-pad"
              value={duration}
              onChangeText={setDuration}
              returnKeyType="done"
              onSubmitEditing={() => void handleSave()}
            />

            <View style={styles.categorySection}>
              <ThemedText type="defaultSemiBold" style={styles.categoryLabel}>
                Task category
              </ThemedText>
              <View style={styles.categoryOptions}>
                {TASK_CATEGORY_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={({ pressed }) => [
                      styles.categoryChip,
                      category === option.value && styles.categoryChipSelected,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => setCategory(option.value)}
                  >
                    <ThemedText
                      type="defaultSemiBold"
                      style={[
                        styles.categoryChipText,
                        category === option.value && styles.categoryChipTextSelected,
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.categorySection}>
              <ThemedText type="defaultSemiBold" style={styles.categoryLabel}>
                Task type
              </ThemedText>
              <View style={styles.typeOptions}>
                {TASK_TYPE_OPTIONS.map((option) => {
                  const selected = taskType === option.value;

                  return (
                    <Pressable
                      key={option.value}
                      style={({ pressed }) => [
                        styles.typeCard,
                        selected && styles.typeCardSelected,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => setTaskType(option.value)}
                    >
                      <ThemedText
                        type="defaultSemiBold"
                        style={[styles.typeCardTitle, selected && styles.typeCardTitleSelected]}
                      >
                        {option.label}
                      </ThemedText>
                      <ThemedText
                        style={[styles.typeCardHelper, selected && styles.typeCardHelperSelected]}
                      >
                        {option.helper}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {taskType === 'REPEATING' ? (
              <>
                <View style={styles.categorySection}>
                  <ThemedText type="defaultSemiBold" style={styles.categoryLabel}>
                    Repeat on
                  </ThemedText>
                  <ThemedText style={styles.helperText}>
                    Leave all days empty if this habit should be due every day.
                  </ThemedText>
                  <View style={styles.categoryOptions}>
                    {REPEAT_DAY_OPTIONS.map((option) => {
                      const selected = repeatDays.includes(option.value);

                      return (
                        <Pressable
                          key={option.value}
                          style={({ pressed }) => [
                            styles.categoryChip,
                            selected && styles.categoryChipSelected,
                            pressed && styles.buttonPressed,
                          ]}
                          onPress={() => toggleRepeatDay(option.value)}
                        >
                          <ThemedText
                            type="defaultSemiBold"
                            style={[
                              styles.categoryChipText,
                              selected && styles.categoryChipTextSelected,
                            ]}
                          >
                            {option.label}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Preferred time (for example 07:30 or Evening)"
                  placeholderTextColor="#7A7A7A"
                  value={preferredTime}
                  onChangeText={setPreferredTime}
                />
              </>
            ) : null}

            <ThemedView style={styles.switchRow}>
              <View style={styles.switchLabelGroup}>
                <ThemedText type="defaultSemiBold" style={styles.switchLabel}>
                  Task status
                </ThemedText>
                <ThemedText style={styles.helperText}>
                  {taskType === 'REPEATING'
                    ? 'Repeating tasks stay available after each completed session.'
                    : completed
                      ? 'This one-time task was completed by a finished focus session.'
                      : 'This one-time task will complete automatically after a finished focus session.'}
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
                styles.focusButton,
                pressed && styles.buttonPressed,
                (loading || deleting) && styles.buttonDisabled,
              ]}
              onPress={handleStartFocusSession}
              disabled={loading || deleting}
            >
              <ThemedText type="defaultSemiBold" style={styles.focusButtonText}>
                Start Focus Session
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
                  Delete Task
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
  categorySection: {
    gap: 10,
  },
  categoryLabel: {
    color: '#EAF6F0',
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeOptions: {
    gap: 10,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#355648',
    backgroundColor: '#1A2D26',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  categoryChipSelected: {
    borderColor: '#63C174',
    backgroundColor: '#234233',
  },
  categoryChipText: {
    color: '#B7CCC2',
  },
  categoryChipTextSelected: {
    color: '#EAF6F0',
  },
  typeCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#355648',
    backgroundColor: '#1A2D26',
    padding: 14,
    gap: 4,
  },
  typeCardSelected: {
    borderColor: '#63C174',
    backgroundColor: '#234233',
  },
  typeCardTitle: {
    color: '#EAF6F0',
  },
  typeCardTitleSelected: {
    color: '#F5FFF7',
  },
  typeCardHelper: {
    color: '#98B7A7',
  },
  typeCardHelperSelected: {
    color: '#CFE7D7',
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
    lineHeight: 20,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  statusPillOpen: {
    backgroundColor: '#173327',
    borderColor: '#4FAF7A',
  },
  statusPillDone: {
    backgroundColor: '#253345',
    borderColor: '#88B8FF',
  },
  statusPillText: {
    fontSize: 12,
  },
  statusPillTextOpen: {
    color: '#9AE4B2',
  },
  statusPillTextDone: {
    color: '#B8D8FF',
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
  focusButton: {
    backgroundColor: '#285543',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4FAF7A',
    marginTop: 4,
  },
  focusButtonText: {
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
