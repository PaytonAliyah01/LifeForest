import type { RefObject } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { appSharedStyles } from '@/components/ui/app-theme';
import { AppTextField } from '@/components/ui/app-text-field';
import type { RepeatDay, TaskCategory, TaskType } from '@/services/tasksApi';

const TASK_CATEGORY_OPTIONS: { value: TaskCategory; label: string }[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'WORK', label: 'Work' },
  { value: 'STUDY', label: 'Study' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'CREATIVE', label: 'Creative' },
];

const TASK_TYPE_OPTIONS: { value: TaskType; label: string; helper: string }[] = [
  {
    value: 'ONE_TIME',
    label: 'One-time',
    helper: 'Completes after one finished focus session.',
  },
  {
    value: 'REPEATING',
    label: 'Repeating',
    helper: 'Stays available and can grow a new tree each time.',
  },
];

const REPEAT_DAY_OPTIONS: { value: RepeatDay; label: string }[] = [
  { value: 'MONDAY', label: 'Mon' },
  { value: 'TUESDAY', label: 'Tue' },
  { value: 'WEDNESDAY', label: 'Wed' },
  { value: 'THURSDAY', label: 'Thu' },
  { value: 'FRIDAY', label: 'Fri' },
  { value: 'SATURDAY', label: 'Sat' },
  { value: 'SUNDAY', label: 'Sun' },
];

type TaskFormFieldsProps = {
  title: string;
  onChangeTitle: (value: string) => void;
  description: string;
  onChangeDescription: (value: string) => void;
  duration: string;
  onChangeDuration: (value: string) => void;
  category: TaskCategory;
  onChangeCategory: (value: TaskCategory) => void;
  taskType: TaskType;
  onChangeTaskType: (value: TaskType) => void;
  repeatDays: RepeatDay[];
  onChangeRepeatDays: (value: RepeatDay[]) => void;
  preferredTime: string;
  onChangePreferredTime: (value: string) => void;
  onSubmit: () => void;
  descriptionInputRef?: RefObject<TextInput | null>;
  durationInputRef?: RefObject<TextInput | null>;
  titleTestID?: string;
  descriptionTestID?: string;
  durationTestID?: string;
};

export function TaskFormFields({
  title,
  onChangeTitle,
  description,
  onChangeDescription,
  duration,
  onChangeDuration,
  category,
  onChangeCategory,
  taskType,
  onChangeTaskType,
  repeatDays,
  onChangeRepeatDays,
  preferredTime,
  onChangePreferredTime,
  onSubmit,
  descriptionInputRef,
  durationInputRef,
  titleTestID,
  descriptionTestID,
  durationTestID,
}: TaskFormFieldsProps) {
  const toggleRepeatDay = (day: RepeatDay) => {
    onChangeRepeatDays(
      repeatDays.includes(day)
        ? repeatDays.filter((currentDay) => currentDay !== day)
        : [...repeatDays, day],
    );
  };

  return (
    <>
      <AppTextField
        testID={titleTestID}
        placeholder="Task title"
        value={title}
        onChangeText={onChangeTitle}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => descriptionInputRef?.current?.focus()}
      />

      <AppTextField
        ref={descriptionInputRef}
        testID={descriptionTestID}
        style={styles.textArea}
        placeholder="Description (optional)"
        multiline
        numberOfLines={4}
        multilineHeight={110}
        value={description}
        onChangeText={onChangeDescription}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => durationInputRef?.current?.focus()}
      />

      <AppTextField
        ref={durationInputRef}
        testID={durationTestID}
        placeholder="Duration in minutes (optional)"
        keyboardType="number-pad"
        value={duration}
        onChangeText={onChangeDuration}
        returnKeyType="done"
        onSubmitEditing={() => onSubmit()}
      />

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
          Task category
        </ThemedText>
        <View style={styles.chipRow}>
          {TASK_CATEGORY_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.categoryChip,
                category === option.value && styles.categoryChipSelected,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => onChangeCategory(option.value)}
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

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
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
                onPress={() => onChangeTaskType(option.value)}
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
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
              Repeat on
            </ThemedText>
            <ThemedText style={appSharedStyles.helperText}>
              Leave all days empty if this habit should be due every day.
            </ThemedText>
            <View style={styles.chipRow}>
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

          <AppTextField
            placeholder="Preferred time (for example 07:30 or Evening)"
            value={preferredTime}
            onChangeText={onChangePreferredTime}
          />
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  textArea: {
    minHeight: 110,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    color: '#EAF6F0',
  },
  chipRow: {
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
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
