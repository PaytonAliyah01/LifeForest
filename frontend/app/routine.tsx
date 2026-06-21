import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { isAxiosError } from 'axios';

import { AppButton } from '@/components/ui/app-button';
import { appColors } from '@/components/ui/app-theme';
import { ForestHeaderArt } from '@/components/forest-header-art';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getTasksByRoutine, type Task } from '@/services/tasksApi';

const parseTextParam = (value: string | string[] | undefined): string => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue ?? '';
};

const parseCompletedParam = (value: string | string[] | undefined): boolean => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue === 'true';
};

const formatTaskDuration = (duration: number): string => {
  if (duration < 60) {
    return `${duration} min`;
  }

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  if (minutes === 0) {
    return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
  }

  return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ${minutes} min`;
};

const formatCategoryLabel = (category: Task['category']): string => {
  switch (category) {
    case 'WORK':
      return 'Work';
    case 'STUDY':
      return 'Study';
    case 'HEALTH':
      return 'Health';
    case 'CREATIVE':
      return 'Creative';
    case 'GENERAL':
    default:
      return 'General';
  }
};

const formatTaskTypeLabel = (taskType: Task['taskType']): string =>
  taskType === 'REPEATING' ? 'Repeating' : 'One-time';

const formatRepeatDays = (repeatDays: Task['repeatDays']): string => {
  if (!repeatDays || repeatDays.length === 0) {
    return 'Daily';
  }

  return repeatDays
    .map((repeatDay) => repeatDay.slice(0, 3).toLowerCase())
    .map((label) => label.charAt(0).toUpperCase() + label.slice(1))
    .join(', ');
};

const isTaskAvailableForFocus = (task: Task): boolean =>
  task.taskType === 'REPEATING' || !task.completed;

export default function RoutineScreen() {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    description?: string;
    completed?: string;
  }>();

  const routineId = useMemo(() => Number(params.id), [params.id]);
  const routineTitle = useMemo(() => parseTextParam(params.title), [params.title]);
  const routineDescription = useMemo(() => parseTextParam(params.description), [params.description]);
  const routineCompleted = useMemo(() => parseCompletedParam(params.completed), [params.completed]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);

  const horizontalPadding = width < 380 ? 16 : width < 768 ? 24 : 32;
  const contentMaxWidth = width < 768 ? width - horizontalPadding * 2 : 920;

  useEffect(() => {
    const loadTasks = async () => {
      if (!Number.isFinite(routineId)) {
        setTasks([]);
        setLoading(false);
        setErrorMessage('This routine could not be loaded.');
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        const response = await getTasksByRoutine(routineId);
        setTasks(response);
      } catch (error) {
        if (isAxiosError(error)) {
          const data = error.response?.data as
            | {
                error?: string;
                message?: string;
              }
            | undefined;

          setErrorMessage(data?.error || data?.message || 'Could not load this routine.');
        } else {
          setErrorMessage('Could not load this routine.');
        }
      } finally {
        setLoading(false);
      }
    };

    void loadTasks();
  }, [routineId]);

  const completedTaskCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks],
  );
  const focusableTaskCount = useMemo(
    () => tasks.filter(isTaskAvailableForFocus).length,
    [tasks],
  );

  const openTaskEditor = (task: Task) => {
    router.push({
      pathname: '/edit-task',
      params: {
        taskId: String(task.id),
        routineId: String(task.routineId),
        title: task.title,
        description: task.description ?? '',
        duration: task.duration == null ? '' : String(task.duration),
        category: task.category,
        taskType: task.taskType,
        repeatDays: task.repeatDays.join(','),
        preferredTime: task.preferredTime ?? '',
        completed: String(task.completed),
      },
    });
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D6E6D7', dark: '#112018' }}
      headerImage={<ForestHeaderArt />}
    >
      <ThemedView
        style={[
          styles.content,
          {
            paddingHorizontal: horizontalPadding,
            maxWidth: contentMaxWidth,
          },
        ]}
      >
        <ThemedView style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroCopy}>
              <ThemedText type="title" style={styles.heroTitle}>
                {routineTitle || 'Routine'}
              </ThemedText>
              <ThemedText style={styles.heroSubtitle}>
                {routineDescription || 'This habit system holds the repeating habits and one-time work that support your daily rhythm.'}
              </ThemedText>
            </View>

            <View style={[styles.stateBadge, routineCompleted ? styles.stateDone : styles.stateActive]}>
              <ThemedText
                type="defaultSemiBold"
                style={[styles.stateBadgeText, routineCompleted ? styles.stateDoneText : styles.stateActiveText]}
              >
                {routineCompleted ? 'Completed' : 'Growing'}
              </ThemedText>
            </View>
          </View>

          <View style={styles.statsRow}>
            <ThemedView style={styles.statCard}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>
                {tasks.length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Habit items</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>
                {completedTaskCount}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Completed</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>
                {focusableTaskCount}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Ready to focus</ThemedText>
            </ThemedView>
          </View>

            <View style={styles.actionsRow}>
            <AppButton
              label="Add Habit or Task"
              style={styles.primaryButton}
              onPress={() =>
                router.push({
                  pathname: '/add-task',
                  params: {
                    routineId: String(routineId),
                    routineTitle,
                  },
                })
              }
            />

            <AppButton
              label="Edit Routine"
              variant="secondary"
              style={styles.secondaryButton}
              onPress={() =>
                router.push({
                  pathname: '/edit-routine',
                  params: {
                    id: String(routineId),
                    title: routineTitle,
                    description: routineDescription,
                    completed: String(routineCompleted),
                  },
                })
              }
            />
          </View>
        </ThemedView>

        <ThemedView style={styles.sectionCard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Habit Items
          </ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            Open an item to edit its schedule, or start a focus session from the ones that are ready.
          </ThemedText>

          {loading ? (
            <ThemedView style={styles.feedbackCard}>
              <ActivityIndicator size="small" color={appColors.primary} />
              <ThemedText style={styles.feedbackText}>Loading tasks...</ThemedText>
            </ThemedView>
          ) : errorMessage ? (
            <ThemedView style={styles.feedbackCard}>
              <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            </ThemedView>
          ) : tasks.length === 0 ? (
            <ThemedView style={styles.feedbackCard}>
              <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                No habit items yet
              </ThemedText>
              <ThemedText style={styles.feedbackText}>
                Add the first repeating habit or one-time task to start turning this system into action.
              </ThemedText>
            </ThemedView>
          ) : (
            <View style={styles.tasksList}>
              {tasks.map((task) => (
                <Pressable
                  key={task.id}
                  style={({ pressed }) => [
                    styles.taskCard,
                    pressed && styles.taskCardPressed,
                  ]}
                  onPress={() => openTaskEditor(task)}
                >
                  <View style={styles.taskHeaderRow}>
                    <ThemedText type="defaultSemiBold" style={styles.taskTitle}>
                      {task.title}
                    </ThemedText>
                    <View style={styles.taskBadge}>
                      <ThemedText style={styles.taskBadgeText}>
                        {formatCategoryLabel(task.category)}
                      </ThemedText>
                    </View>
                    <View style={styles.taskBadge}>
                      <ThemedText style={styles.taskBadgeText}>
                        {formatTaskTypeLabel(task.taskType)}
                      </ThemedText>
                    </View>
                  </View>

                  {task.description ? (
                    <ThemedText style={styles.taskDescription}>{task.description}</ThemedText>
                  ) : null}

                  <View style={styles.taskMetaRow}>
                    <ThemedText style={styles.taskMetaText}>
                      {task.duration != null ? formatTaskDuration(task.duration) : 'No duration set'}
                    </ThemedText>
                    <ThemedText style={styles.taskMetaText}>
                      {task.taskType === 'REPEATING'
                        ? `${formatRepeatDays(task.repeatDays)}${task.preferredTime ? ` • ${task.preferredTime}` : ''}`
                        : task.completed
                          ? 'Completed'
                          : 'Ready to focus'}
                    </ThemedText>
                  </View>

                  {isTaskAvailableForFocus(task) ? (
                    <AppButton
                      label="Start Session"
                      variant="secondary"
                      style={styles.focusButton}
                      onPress={(event) => {
                        event.stopPropagation();
                        router.push({
                          pathname: '/focus-session',
                          params: {
                            taskId: String(task.id),
                            taskTitle: task.title,
                            taskDuration: task.duration == null ? '' : String(task.duration),
                          },
                        } as never);
                      }}
                    />
                  ) : null}
                </Pressable>
              ))}
            </View>
          )}
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: '#13241D',
    borderWidth: 1,
    borderColor: appColors.cardBorder,
    gap: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
    backgroundColor: 'transparent',
  },
  heroCopy: {
    flex: 1,
    gap: 8,
    backgroundColor: 'transparent',
  },
  heroTitle: {
    color: '#F1F7EE',
  },
  heroSubtitle: {
    color: appColors.mutedText,
    lineHeight: 22,
  },
  stateBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stateActive: {
    backgroundColor: appColors.greenPanel,
    borderColor: appColors.secondaryBorder,
  },
  stateDone: {
    backgroundColor: '#233140',
    borderColor: '#88B8FF',
  },
  stateBadgeText: {
    fontSize: 12,
  },
  stateActiveText: {
    color: appColors.greenText,
  },
  stateDoneText: {
    color: '#B4D4FF',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: 'transparent',
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#182D24',
    borderWidth: 1,
    borderColor: appColors.panelBorder,
    gap: 4,
  },
  statValue: {
    color: '#F1F7EE',
    fontSize: 28,
  },
  statLabel: {
    color: appColors.subtleText,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: 'transparent',
  },
  primaryButton: {
    flex: 1,
    minWidth: 150,
    paddingHorizontal: 18,
  },
  secondaryButton: {
    flex: 1,
    minWidth: 150,
    paddingHorizontal: 18,
  },
  sectionCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: appColors.card,
    borderWidth: 1,
    borderColor: appColors.cardBorder,
    gap: 12,
  },
  sectionTitle: {
    color: '#F1F7EE',
  },
  sectionSubtitle: {
    color: appColors.subtleText,
    lineHeight: 20,
  },
  feedbackCard: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: '#162821',
    borderWidth: 1,
    borderColor: appColors.cardBorder,
    gap: 10,
    alignItems: 'center',
  },
  feedbackText: {
    color: '#A7C8B7',
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#F1F7EE',
  },
  errorText: {
    color: '#FF9B9B',
  },
  tasksList: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  taskCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#1A2E25',
    borderWidth: 1,
    borderColor: '#2F5244',
    gap: 8,
  },
  taskCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  taskHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  taskTitle: {
    flexBasis: '100%',
    color: '#F1F7EE',
  },
  taskBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: appColors.cardBorder,
    maxWidth: '100%',
  },
  taskBadgeText: {
    color: '#BFE7D2',
    fontSize: 12,
    flexShrink: 1,
  },
  taskDescription: {
    color: '#A7C8B7',
    lineHeight: 20,
  },
  taskMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: 'transparent',
  },
  taskMetaText: {
    color: appColors.subtleText,
    flexShrink: 1,
  },
  focusButton: {
    marginTop: 2,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    backgroundColor: '#2B5642',
    borderColor: '#7CCF96',
    borderRadius: 999,
    paddingVertical: 8,
  },
});
