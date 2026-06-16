import { useMemo, useRef, useState } from 'react';
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

import { api } from '@/services/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { createTask, type RepeatDay, type TaskCategory, type TaskType } from '@/services/tasksApi';

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
    helper: 'Completes after one finished focus session.',
  },
  {
    value: 'REPEATING',
    label: 'Repeating',
    helper: 'Can keep giving you a new tree each session.',
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

  const toggleRepeatDay = (day: RepeatDay) => {
    setRepeatDays((currentDays) =>
      currentDays.includes(day)
        ? currentDays.filter((currentDay) => currentDay !== day)
        : [...currentDays, day],
    );
  };

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
            Add Task
          </ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            {routineTitle
              ? `Create a task for "${routineTitle}".`
              : 'Create a task for this routine.'}
          </ThemedText>

          <View style={styles.form}>
            <TextInput
              testID="add-task-title-input"
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
              testID="add-task-description-input"
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
              testID="add-task-duration-input"
              style={styles.input}
              placeholder="Duration in minutes (optional)"
              placeholderTextColor="#7A7A7A"
              keyboardType="number-pad"
              value={duration}
              onChangeText={setDuration}
              returnKeyType="done"
              onSubmitEditing={() => void handleCreateTask()}
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

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                  loading && styles.buttonDisabled,
                ]}
                onPress={() => router.back()}
                disabled={loading}
              >
                <ThemedText type="defaultSemiBold" style={styles.secondaryButtonText}>
                  Cancel
                </ThemedText>
              </Pressable>

              <Pressable
                testID="add-task-submit-button"
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                  (!canCreate || loading) && styles.buttonDisabled,
                ]}
                onPress={() => void handleCreateTask()}
                disabled={!canCreate || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>
                    Create Task
                  </ThemedText>
                )}
              </Pressable>
            </View>

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
  helperText: {
    color: '#98B7A7',
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
