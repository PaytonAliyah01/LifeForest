import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { isAxiosError } from 'axios';

import { ForestHeaderArt } from '@/components/forest-header-art';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { appColors } from '@/components/ui/app-theme';
import { getUserIdFromToken } from '@/services/authStorage';
import { getRoutinesByUser, type Routine } from '@/services/routinesApi';
import { getTasksByRoutine, type Task } from '@/services/tasksApi';

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

const isRoutineVisuallyCompleted = (routine: Routine, tasks: Task[]): boolean => {
  if (routine.completed) {
    return true;
  }

  return tasks.length === 1 && tasks[0]?.completed === true;
};

export default function RoutinesScreen() {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [tasksByRoutine, setTasksByRoutine] = useState<Record<number, Task[]>>({});

  const horizontalPadding = width < 380 ? 16 : width < 768 ? 24 : 32;
  const contentMaxWidth = width < 768 ? width - horizontalPadding * 2 : 940;

  const loadRoutines = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const userId = await getUserIdFromToken();

      if (!userId) {
        setRoutines([]);
        setTasksByRoutine({});
        return;
      }

      const routinesResponse = await getRoutinesByUser(userId);
      setRoutines(routinesResponse);

      const tasksEntries = await Promise.all(
        routinesResponse.map(async (routine) => {
          try {
            return [routine.id, await getTasksByRoutine(routine.id)] as const;
          } catch (error) {
            console.log(`Task fetch error for routine ${routine.id}:`, error);
            return [routine.id, []] as const;
          }
        }),
      );

      setTasksByRoutine(Object.fromEntries(tasksEntries));
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 404) {
          setRoutines([]);
          setTasksByRoutine({});
          return;
        }

        const data = error.response?.data as
          | {
              error?: string;
              message?: string;
            }
          | undefined;

        setErrorMessage(data?.error || data?.message || 'Could not load your routines.');
      } else {
        setErrorMessage('Could not load your routines.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoutines();
  }, [loadRoutines]);

  useFocusEffect(
    useCallback(() => {
      void loadRoutines();
    }, [loadRoutines]),
  );

  const completedRoutineCount = useMemo(
    () =>
      routines.filter((routine) =>
        isRoutineVisuallyCompleted(routine, tasksByRoutine[routine.id] ?? []),
      ).length,
    [routines, tasksByRoutine],
  );

  const openRoutineScreen = (routine: Routine) => {
    router.push({
      pathname: '/routine',
      params: {
        id: String(routine.id),
        title: routine.title,
        description: routine.description ?? '',
        completed: String(routine.completed),
      },
    });
  };

  const openRoutineEditor = (routine: Routine) => {
    router.push({
      pathname: '/edit-routine',
      params: {
        id: String(routine.id),
        title: routine.title,
        description: routine.description ?? '',
        completed: String(routine.completed),
      },
    });
  };

  const openFocusSession = (task: Task) => {
    router.push({
      pathname: '/focus-session',
      params: {
        taskId: String(task.id),
        taskTitle: task.title,
        taskDuration: task.duration == null ? '' : String(task.duration),
      },
    } as never);
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
          <ThemedText type="title" style={styles.heroTitle}>
            Your Habit Systems
          </ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Each routine is a small system that holds your repeating habits and one-time work together.
          </ThemedText>

          <View style={styles.statsRow}>
            <ThemedView style={styles.statCard}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>
                {routines.length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Habit systems</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>
                {completedRoutineCount}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Completed</ThemedText>
            </ThemedView>
          </View>

          <Pressable style={styles.primaryButton} onPress={() => router.push('/create-routine')}>
            <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>
              Create Habit System
            </ThemedText>
          </Pressable>
        </ThemedView>

        {loading ? (
          <ThemedView style={styles.feedbackCard}>
            <ActivityIndicator size="small" color={appColors.primary} />
            <ThemedText style={styles.feedbackText}>Loading your routines...</ThemedText>
          </ThemedView>
        ) : errorMessage ? (
          <ThemedView style={styles.feedbackCard}>
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          </ThemedView>
        ) : routines.length === 0 ? (
            <ThemedView style={styles.feedbackCard}>
              <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                No habit systems yet
              </ThemedText>
              <ThemedText style={styles.feedbackText}>
                Create your first routine to give your habits a home.
              </ThemedText>
            </ThemedView>
        ) : (
          routines.map((routine) => {
            const tasks = tasksByRoutine[routine.id] ?? [];
            const isCompleted = isRoutineVisuallyCompleted(routine, tasks);

            return (
              <Pressable
                key={routine.id}
                style={({ pressed }) => [
                  styles.routineCard,
                  pressed && styles.routineCardPressed,
                ]}
                onPress={() => openRoutineScreen(routine)}
              >
                <View style={styles.routineHeaderRow}>
                  <View style={styles.routineHeaderCopy}>
                    <ThemedText type="defaultSemiBold" style={styles.routineTitle}>
                      {routine.title}
                    </ThemedText>
                    {routine.description ? (
                      <ThemedText style={styles.routineDescription}>
                        {routine.description}
                      </ThemedText>
                    ) : (
                      <ThemedText style={styles.routineDescriptionMuted}>
                        Add a description so this habit system has a clear purpose.
                      </ThemedText>
                    )}
                  </View>

                  <View
                    style={[
                      styles.routineStateBadge,
                      isCompleted ? styles.routineStateDone : styles.routineStateActive,
                    ]}
                  >
                    <ThemedText
                      type="defaultSemiBold"
                      style={[
                        styles.routineStateText,
                        isCompleted ? styles.routineStateTextDone : styles.routineStateTextActive,
                      ]}
                    >
                      {isCompleted ? 'Completed' : 'Growing'}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.routineMetaRow}>
                  <ThemedText style={styles.routineMetaText}>
                    {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                  </ThemedText>
                  <ThemedText style={styles.routineMetaDivider}>•</ThemedText>
                  <ThemedText style={styles.routineMetaText}>
                    {tasks.filter((task) => task.completed).length} finished
                  </ThemedText>
                </View>

                <ThemedView style={styles.tasksSection}>
                  {tasks.length > 0 ? (
                    tasks.map((task) => (
                      <Pressable
                        key={task.id}
                        style={({ pressed }) => [
                          styles.taskCard,
                          pressed && styles.taskCardPressed,
                        ]}
                        onPress={(event) => {
                          event.stopPropagation();
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
                        }}
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
                          <Pressable
                            style={({ pressed }) => [
                              styles.focusButton,
                              pressed && styles.taskActionPressed,
                            ]}
                            onPress={(event) => {
                              event.stopPropagation();
                              openFocusSession(task);
                            }}
                          >
                            <ThemedText type="defaultSemiBold" style={styles.focusButtonText}>
                              Start Session
                            </ThemedText>
                          </Pressable>
                        ) : null}
                      </Pressable>
                    ))
                  ) : (
                    <ThemedText style={styles.emptyTaskText}>
                      No tasks yet for this routine.
                    </ThemedText>
                  )}
                </ThemedView>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={(event) => {
                    event.stopPropagation();
                    openRoutineEditor(routine);
                  }}
                >
                  <ThemedText type="defaultSemiBold" style={styles.secondaryButtonText}>
                    Edit Routine
                  </ThemedText>
                </Pressable>
              </Pressable>
            );
          })
        )}
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
    backgroundColor: appColors.card,
    borderWidth: 1,
    borderColor: appColors.cardBorder,
    gap: 18,
  },
  heroTitle: {
    color: appColors.text,
  },
  heroSubtitle: {
    color: appColors.mutedText,
    lineHeight: 22,
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
    backgroundColor: appColors.cardAlt,
    borderWidth: 1,
    borderColor: appColors.panelBorder,
    gap: 4,
  },
  statValue: {
    color: appColors.text,
    fontSize: 28,
  },
  statLabel: {
    color: appColors.subtleText,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primary,
    borderWidth: 1,
    borderColor: appColors.primaryBorder,
  },
  primaryButtonText: {
    color: appColors.primaryText,
    fontSize: 15,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: appColors.secondary,
    borderWidth: 1,
    borderColor: appColors.secondaryBorder,
  },
  secondaryButtonText: {
    color: appColors.secondaryText,
    fontSize: 14,
  },
  feedbackCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: appColors.card,
    borderWidth: 1,
    borderColor: appColors.cardBorder,
    gap: 10,
    alignItems: 'center',
  },
  feedbackText: {
    color: appColors.mutedText,
    textAlign: 'center',
  },
  emptyTitle: {
    color: appColors.text,
  },
  errorText: {
    color: appColors.error,
  },
  routineCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: appColors.card,
    borderWidth: 1,
    borderColor: appColors.cardBorder,
    gap: 14,
  },
  routineCardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  routineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 14,
    backgroundColor: 'transparent',
  },
  routineHeaderCopy: {
    flex: 1,
    gap: 6,
    backgroundColor: 'transparent',
  },
  routineTitle: {
    color: appColors.text,
    fontSize: 19,
  },
  routineDescription: {
    color: appColors.mutedText,
    lineHeight: 20,
  },
  routineDescriptionMuted: {
    color: appColors.subtleText,
    fontStyle: 'italic',
  },
  routineStateBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  routineStateActive: {
    backgroundColor: appColors.greenPanel,
    borderColor: appColors.secondaryBorder,
  },
  routineStateDone: {
    backgroundColor: appColors.bluePanel,
    borderColor: appColors.blueBorder,
  },
  routineStateText: {
    fontSize: 12,
  },
  routineStateTextActive: {
    color: appColors.greenText,
  },
  routineStateTextDone: {
    color: appColors.blueText,
  },
  routineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'transparent',
  },
  routineMetaText: {
    color: appColors.subtleText,
  },
  routineMetaDivider: {
    color: appColors.panelBorder,
  },
  tasksSection: {
    gap: 10,
    backgroundColor: 'transparent',
  },
  taskCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: appColors.panel,
    borderWidth: 1,
    borderColor: appColors.panelBorder,
    gap: 8,
  },
  taskCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  taskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: 'transparent',
  },
  taskTitle: {
    flexBasis: '100%',
    color: appColors.text,
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
    color: appColors.mutedText,
    fontSize: 12,
    flexShrink: 1,
  },
  taskDescription: {
    color: appColors.softText,
    lineHeight: 20,
  },
  taskMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
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
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: appColors.secondary,
    borderWidth: 1,
    borderColor: appColors.secondaryBorder,
  },
  taskActionPressed: {
    opacity: 0.9,
  },
  focusButtonText: {
    color: appColors.secondaryText,
    fontSize: 14,
  },
  emptyTaskText: {
    color: appColors.subtleText,
  },
});
