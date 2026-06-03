import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { isAxiosError } from 'axios';

import { ForestHeaderArt } from '@/components/forest-header-art';
import { completeHabitToday, getTodayHabitsByUser, uncompleteHabitToday, type TodayHabit } from '@/services/habitsApi';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getAnalyticsByUser, type Analytics } from '@/services/analyticsApi';
import { getUserIdFromToken } from '@/services/authStorage';
import { getRoutinesByUser, type Routine } from '@/services/routinesApi';
import { getTasksByRoutine, type RepeatDay, type Task } from '@/services/tasksApi';
import { getTreesByUser } from '@/services/treesApi';

const WEEKLY_GOAL_MINUTES = 300;

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

const formatRepeatDays = (repeatDays: RepeatDay[]): string => {
  if (repeatDays.length === 0) {
    return 'Daily';
  }

  return repeatDays
    .map((repeatDay) => repeatDay.slice(0, 3).toLowerCase())
    .map((label) => label.charAt(0).toUpperCase() + label.slice(1))
    .join(', ');
};

const isTaskAvailableForFocus = (task: Task): boolean =>
  task.taskType === 'REPEATING' || !task.completed;

const getWeeklyMessage = (weeklyFocusMinutes: number): string => {
  if (weeklyFocusMinutes === 0) {
    return 'No focused habit time logged this week yet.';
  }

  if (weeklyFocusMinutes >= WEEKLY_GOAL_MINUTES) {
    return 'You already reached your weekly focus goal.';
  }

  return `${formatTaskDuration(WEEKLY_GOAL_MINUTES - weeklyFocusMinutes)} left to hit this week’s goal.`;
};

type QueueItem = {
  routine: Routine;
  task: Task;
};

const buildRecentWeek = (): string[] => {
  const dates: string[] = [];

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const [routinesLoading, setRoutinesLoading] = useState(true);
  const [routinesError, setRoutinesError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [tasksByRoutine, setTasksByRoutine] = useState<Record<number, Task[]>>({});
  const [treeCount, setTreeCount] = useState(0);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [todayHabits, setTodayHabits] = useState<TodayHabit[]>([]);
  const [habitActionTaskId, setHabitActionTaskId] = useState<number | null>(null);

  const horizontalPadding = width < 380 ? 16 : width < 768 ? 24 : 32;
  const contentMaxWidth = width < 768 ? width - horizontalPadding * 2 : 940;
  const isCompact = width < 720;
  const recentWeek = useMemo(() => buildRecentWeek(), []);

  const oneTimeFocusItems = useMemo<QueueItem[]>(
    () =>
      routines.flatMap((routine) =>
        (tasksByRoutine[routine.id] ?? [])
          .filter((task) => task.taskType === 'ONE_TIME' && !task.completed)
          .map((task) => ({ routine, task })),
      ),
    [routines, tasksByRoutine],
  );

  const completedOneTimeTaskCount = useMemo(
    () =>
      Object.values(tasksByRoutine).reduce(
        (count, tasks) =>
          count + tasks.filter((task) => task.taskType === 'ONE_TIME' && task.completed).length,
        0,
      ),
    [tasksByRoutine],
  );

  const focusableTaskCount = useMemo(
    () =>
      Object.values(tasksByRoutine).reduce(
        (count, tasks) => count + tasks.filter(isTaskAvailableForFocus).length,
        0,
      ),
    [tasksByRoutine],
  );

  const activeRoutineCount = useMemo(
    () => routines.filter((routine) => !routine.completed).length,
    [routines],
  );

  const weeklyProgress = useMemo(() => {
    if (!analytics) {
      return 0;
    }

    return Math.min(100, Math.round((analytics.weeklyFocusMinutes / WEEKLY_GOAL_MINUTES) * 100));
  }, [analytics]);

  const fetchDashboard = useCallback(async () => {
    setRoutinesLoading(true);
    setRoutinesError('');

    try {
      const userId = await getUserIdFromToken();

      if (!userId) {
        setCurrentUserId(null);
        setRoutines([]);
        setTasksByRoutine({});
        setTreeCount(0);
        setAnalytics(null);
        setTodayHabits([]);
        return;
      }

      setCurrentUserId(userId);

      const routinesResponse = await getRoutinesByUser(userId);
      setRoutines(routinesResponse);

      const [treesResult, analyticsResult, habitsResult, tasksResults] = await Promise.all([
        getTreesByUser(userId)
          .then((treesResponse) => ({ trees: treesResponse }))
          .catch(() => ({ trees: [] })),
        getAnalyticsByUser(userId)
          .then((response) => ({ analytics: response }))
          .catch(() => ({ analytics: null })),
        getTodayHabitsByUser(userId)
          .then((response) => ({ habits: response }))
          .catch(() => ({ habits: [] })),
        Promise.all(
          routinesResponse.map(async (routine) => {
            try {
              return [routine.id, await getTasksByRoutine(routine.id)] as const;
            } catch {
              return [routine.id, []] as const;
            }
          }),
        ),
      ]);

      setTreeCount(treesResult.trees.length);
      setAnalytics(analyticsResult.analytics);
      setTodayHabits(habitsResult.habits);
      setTasksByRoutine(Object.fromEntries(tasksResults));
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        setCurrentUserId(null);
        setRoutines([]);
        setTasksByRoutine({});
        setTreeCount(0);
        setAnalytics(null);
        setTodayHabits([]);
        setRoutinesError('');
        return;
      }

      setCurrentUserId(null);
      setRoutines([]);
      setTasksByRoutine({});
      setTreeCount(0);
      setAnalytics(null);
      setTodayHabits([]);
      setRoutinesError('Could not load your habit dashboard right now.');
    } finally {
      setRoutinesLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  useFocusEffect(
    useCallback(() => {
      void fetchDashboard();
    }, [fetchDashboard]),
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

  const openFocusSession = (task?: Task) => {
    router.push({
      pathname: '/focus-session',
      params: task
        ? {
            taskId: String(task.id),
            taskTitle: task.title,
            taskDuration: task.duration == null ? '' : String(task.duration),
          }
        : {},
    } as never);
  };

  const toggleHabitCompletion = async (habit: TodayHabit) => {
    if (!currentUserId) {
      return;
    }

    setHabitActionTaskId(habit.taskId);

    try {
      const updatedHabit = habit.completedToday
        ? await uncompleteHabitToday(currentUserId, habit.taskId)
        : await completeHabitToday(currentUserId, habit.taskId);

      setTodayHabits((currentHabits) =>
        currentHabits.map((currentHabit) =>
          currentHabit.taskId === updatedHabit.taskId ? updatedHabit : currentHabit,
        ),
      );
    } finally {
      setHabitActionTaskId(null);
    }
  };

  const renderTodayHabitCard = (habit: TodayHabit) => {
    const taskForNavigation: Task = {
      id: habit.taskId,
      routineId: habit.routineId,
      title: habit.title,
      description: habit.description,
      duration: habit.duration,
      category: habit.category,
      taskType: 'REPEATING',
      repeatDays: habit.repeatDays,
      preferredTime: habit.preferredTime,
      completed: false,
    };

    return (
      <Pressable
        key={habit.taskId}
        style={({ pressed }) => [styles.habitCard, pressed && styles.habitCardPressed]}
        onPress={() => openTaskEditor(taskForNavigation)}
      >
        <View style={styles.habitHeaderRow}>
          <View style={styles.habitCopy}>
            <ThemedText type="defaultSemiBold" style={styles.habitTitle}>
              {habit.title}
            </ThemedText>
            <ThemedText style={styles.habitRoutineLabel}>{habit.routineTitle}</ThemedText>
          </View>

          <ThemedView style={[styles.habitTypeBadge, styles.habitTypeBadgeHabit]}>
            <ThemedText style={[styles.habitTypeBadgeText, styles.habitTypeBadgeTextHabit]}>
              Due today
            </ThemedText>
          </ThemedView>
        </View>

        {habit.description ? (
          <ThemedText style={styles.habitDescription}>{habit.description}</ThemedText>
        ) : null}

        <View style={styles.habitMetaRow}>
          <ThemedView style={styles.metaChip}>
            <ThemedText style={styles.metaChipText}>{formatCategoryLabel(habit.category)}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.metaChip}>
            <ThemedText style={styles.metaChipText}>{formatRepeatDays(habit.repeatDays)}</ThemedText>
          </ThemedView>
          {habit.preferredTime ? (
            <ThemedView style={styles.metaChip}>
              <ThemedText style={styles.metaChipText}>{habit.preferredTime}</ThemedText>
            </ThemedView>
          ) : null}
          {habit.duration != null ? (
            <ThemedView style={styles.metaChip}>
              <ThemedText style={styles.metaChipText}>{formatTaskDuration(habit.duration)}</ThemedText>
            </ThemedView>
          ) : null}
        </View>

        <View style={styles.habitStatsRow}>
          <ThemedView style={styles.habitStatChip}>
            <ThemedText style={styles.habitStatValue}>{habit.currentStreak}</ThemedText>
            <ThemedText style={styles.habitStatLabel}>day streak</ThemedText>
          </ThemedView>
          <ThemedView style={styles.habitStatChip}>
            <ThemedText style={styles.habitStatValue}>{habit.weeklyCompletionCount}</ThemedText>
            <ThemedText style={styles.habitStatLabel}>done this week</ThemedText>
          </ThemedView>
        </View>

        <View style={styles.historyRow}>
          {recentWeek.map((date) => {
            const completed = habit.recentCompletedDates.includes(date);

            return (
              <View
                key={`${habit.taskId}-${date}`}
                style={[styles.historyDot, completed ? styles.historyDotDone : styles.historyDotOpen]}
              />
            );
          })}
        </View>

        <View style={styles.habitActionRow}>
          <Pressable
            style={({ pressed }) => [
              styles.habitCheckoffButton,
              habit.completedToday ? styles.habitCheckoffDone : styles.habitCheckoffOpen,
              pressed && styles.habitActionButtonPressed,
              habitActionTaskId === habit.taskId && styles.habitActionButtonDisabled,
            ]}
            onPress={(event) => {
              event.stopPropagation();
              void toggleHabitCompletion(habit);
            }}
            disabled={habitActionTaskId === habit.taskId}
          >
            {habitActionTaskId === habit.taskId ? (
              <ActivityIndicator size="small" color="#F3FBF6" />
            ) : (
              <ThemedText type="defaultSemiBold" style={styles.habitCheckoffButtonText}>
                {habit.completedToday ? 'Completed Today' : 'Check Off Habit'}
              </ThemedText>
            )}
          </Pressable>

          <Pressable
            style={styles.habitSecondaryButton}
            onPress={(event) => {
              event.stopPropagation();
              openFocusSession(taskForNavigation);
            }}
          >
            <ThemedText type="defaultSemiBold" style={styles.habitSecondaryButtonText}>
              Start Focus
            </ThemedText>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderQueueCard = (item: QueueItem) => {
    const { routine, task } = item;

    return (
      <Pressable
        key={task.id}
        style={({ pressed }) => [styles.habitCard, pressed && styles.habitCardPressed]}
        onPress={() => openTaskEditor(task)}
      >
        <View style={styles.habitHeaderRow}>
          <View style={styles.habitCopy}>
            <ThemedText type="defaultSemiBold" style={styles.habitTitle}>
              {task.title}
            </ThemedText>
            <ThemedText style={styles.habitRoutineLabel}>{routine.title}</ThemedText>
          </View>

          <ThemedView style={[styles.habitTypeBadge, styles.habitTypeBadgeTask]}>
            <ThemedText style={[styles.habitTypeBadgeText, styles.habitTypeBadgeTextTask]}>
              One-time
            </ThemedText>
          </ThemedView>
        </View>

        {task.description ? (
          <ThemedText style={styles.habitDescription}>{task.description}</ThemedText>
        ) : null}

        <View style={styles.habitMetaRow}>
          <ThemedView style={styles.metaChip}>
            <ThemedText style={styles.metaChipText}>{formatCategoryLabel(task.category)}</ThemedText>
          </ThemedView>
          {task.duration != null ? (
            <ThemedView style={styles.metaChip}>
              <ThemedText style={styles.metaChipText}>{formatTaskDuration(task.duration)}</ThemedText>
            </ThemedView>
          ) : null}
        </View>

        <View style={styles.habitActionRow}>
          <Pressable
            style={({ pressed }) => [
              styles.habitCheckoffButton,
              styles.habitCheckoffOpen,
              pressed && styles.habitActionButtonPressed,
            ]}
            onPress={(event) => {
              event.stopPropagation();
              openFocusSession(task);
            }}
          >
            <ThemedText type="defaultSemiBold" style={styles.habitCheckoffButtonText}>
              Complete Through Focus
            </ThemedText>
          </Pressable>

          <Pressable
            style={styles.habitSecondaryButton}
            onPress={(event) => {
              event.stopPropagation();
              openRoutineScreen(routine);
            }}
          >
            <ThemedText type="defaultSemiBold" style={styles.habitSecondaryButtonText}>
              Open Routine
            </ThemedText>
          </Pressable>
        </View>
      </Pressable>
    );
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
          <View style={[styles.heroTopRow, isCompact && styles.heroTopRowCompact]}>
            <View style={styles.heroCopy}>
              <ThemedText type="title" style={styles.heroTitle}>
                Today&apos;s Habits
              </ThemedText>
              <ThemedText style={styles.heroSubtitle}>
                Show up for your repeating habits first, then use focus sessions to support the
                ones that need extra attention.
              </ThemedText>
            </View>

            <View style={styles.heroBadge}>
              <ThemedText type="defaultSemiBold" style={styles.heroBadgeLabel}>
                Weekly goal
              </ThemedText>
              <ThemedText style={styles.heroBadgeValue}>{weeklyProgress}%</ThemedText>
            </View>
          </View>

          <View style={[styles.heroStatsRow, isCompact && styles.heroStatsColumn]}>
            <ThemedView style={styles.heroStatCard}>
              <ThemedText type="defaultSemiBold" style={styles.heroStatValue}>
                {todayHabits.length}
              </ThemedText>
              <ThemedText style={styles.heroStatLabel}>Habits due today</ThemedText>
            </ThemedView>
            <ThemedView style={styles.heroStatCard}>
              <ThemedText type="defaultSemiBold" style={styles.heroStatValue}>
                {oneTimeFocusItems.length}
              </ThemedText>
              <ThemedText style={styles.heroStatLabel}>One-time tasks open</ThemedText>
            </ThemedView>
            <ThemedView style={styles.heroStatCard}>
              <ThemedText type="defaultSemiBold" style={styles.heroStatValue}>
                {treeCount}
              </ThemedText>
              <ThemedText style={styles.heroStatLabel}>Trees earned</ThemedText>
            </ThemedView>
          </View>

          <View style={[styles.actionRow, isCompact && styles.actionColumn]}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryActionButton,
                focusableTaskCount === 0 && styles.actionButtonDisabled,
                pressed && focusableTaskCount > 0 && styles.actionButtonPressed,
              ]}
              onPress={() => openFocusSession()}
              disabled={focusableTaskCount === 0}
            >
              <ThemedText type="defaultSemiBold" style={styles.primaryActionButtonText}>
                Start Focus Session
              </ThemedText>
            </Pressable>

            <Pressable
              style={styles.secondaryActionButton}
              onPress={() => router.push('/create-routine')}
            >
              <ThemedText type="defaultSemiBold" style={styles.secondaryActionButtonText}>
                Create Habit Routine
              </ThemedText>
            </Pressable>

            <Pressable style={styles.ghostActionButton} onPress={() => void fetchDashboard()}>
              <ThemedText type="defaultSemiBold" style={styles.ghostActionButtonText}>
                Refresh
              </ThemedText>
            </Pressable>
          </View>

          <ThemedText style={styles.actionHelperText}>
            {analytics
              ? getWeeklyMessage(analytics.weeklyFocusMinutes)
              : 'Build routines and complete focus sessions to start shaping your weekly rhythm.'}
          </ThemedText>
        </ThemedView>

        <View style={[styles.panelGrid, isCompact && styles.panelGridCompact]}>
          <ThemedView style={styles.statusCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Habit Rhythm
            </ThemedText>
            <ThemedText style={styles.statusValue}>
              {analytics ? formatTaskDuration(analytics.weeklyFocusMinutes) : '0 min'}
            </ThemedText>
            <ThemedText style={styles.statusMessage}>Focused time logged in the last 7 days.</ThemedText>
          </ThemedView>

          <ThemedView style={styles.statusCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Consistency Snapshot
            </ThemedText>
            <ThemedText style={styles.statusValue}>{activeRoutineCount}</ThemedText>
            <ThemedText style={styles.statusMessage}>
              Active routines supporting your habit system right now.
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.statusCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Completed One-Time Tasks
            </ThemedText>
            <ThemedText style={styles.statusValue}>{completedOneTimeTaskCount}</ThemedText>
            <ThemedText style={styles.statusMessage}>
              Finished one-time tasks earned through focused work.
            </ThemedText>
          </ThemedView>
        </View>

        <ThemedView style={styles.sectionCard}>
          <View style={styles.sectionHeaderCopy}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Today&apos;s Repeating Habits
            </ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Check off habits directly here, track their streaks, or start a focus session when one
              needs more intentional time.
            </ThemedText>
          </View>

          {routinesLoading ? (
            <ThemedView style={styles.feedbackCard}>
              <ActivityIndicator size="small" color="#7EE081" />
              <ThemedText style={styles.feedbackText}>Loading your habits...</ThemedText>
            </ThemedView>
          ) : null}

          {!routinesLoading && routinesError ? (
            <ThemedView style={styles.feedbackCard}>
              <ThemedText style={styles.errorText}>{routinesError}</ThemedText>
            </ThemedView>
          ) : null}

          {!routinesLoading && !routinesError && todayHabits.length === 0 ? (
            <ThemedView style={styles.feedbackCard}>
              <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                No habits due today
              </ThemedText>
              <ThemedText style={styles.feedbackText}>
                Add repeating tasks with a schedule, or wait for your next habit day to come up.
              </ThemedText>
            </ThemedView>
          ) : null}

          {!routinesLoading && !routinesError ? (
            <View style={styles.habitList}>{todayHabits.map((habit) => renderTodayHabitCard(habit))}</View>
          ) : null}
        </ThemedView>

        <ThemedView style={styles.sectionCard}>
          <View style={styles.sectionHeaderCopy}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              One-Time Focus Queue
            </ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              These are the one-time tasks you still need to finish through focused work.
            </ThemedText>
          </View>

          {!routinesLoading && !routinesError && oneTimeFocusItems.length === 0 ? (
            <ThemedView style={styles.feedbackCard}>
              <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                No one-time tasks waiting
              </ThemedText>
              <ThemedText style={styles.feedbackText}>
                Your queue is clear right now, or you have only repeating habits in play.
              </ThemedText>
            </ThemedView>
          ) : null}

          {!routinesLoading && !routinesError ? (
            <View style={styles.habitList}>{oneTimeFocusItems.map(renderQueueCard)}</View>
          ) : null}
        </ThemedView>

        <ThemedView style={styles.sectionCard}>
          <View style={styles.sectionHeaderCopy}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Your Systems
            </ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Routines are the systems that hold your habits together over time.
            </ThemedText>
          </View>

          {!routinesLoading && !routinesError && routines.length === 0 ? (
            <ThemedView style={styles.feedbackCard}>
              <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                No routines yet
              </ThemedText>
              <ThemedText style={styles.feedbackText}>
                Create your first routine to start building a habit system around it.
              </ThemedText>
            </ThemedView>
          ) : null}

          {!routinesLoading && !routinesError ? (
            <View style={styles.systemList}>
              {routines.map((routine) => {
                const tasks = tasksByRoutine[routine.id] ?? [];
                const repeatingCount = tasks.filter((task) => task.taskType === 'REPEATING').length;

                return (
                  <Pressable
                    key={routine.id}
                    style={({ pressed }) => [styles.systemCard, pressed && styles.systemCardPressed]}
                    onPress={() => openRoutineScreen(routine)}
                  >
                    <View style={styles.systemHeaderRow}>
                      <View style={styles.systemCopy}>
                        <ThemedText type="defaultSemiBold" style={styles.systemTitle}>
                          {routine.title}
                        </ThemedText>
                        <ThemedText style={styles.systemDescription}>
                          {routine.description || 'Open this routine to shape its habits and tasks.'}
                        </ThemedText>
                      </View>

                      <ThemedView style={styles.systemCountBadge}>
                        <ThemedText style={styles.systemCountText}>{repeatingCount} habits</ThemedText>
                      </ThemedView>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    alignSelf: 'center',
    gap: 18,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: '#13241D',
    borderWidth: 1,
    borderColor: '#244338',
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
  heroTopRowCompact: {
    flexDirection: 'column',
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
    backgroundColor: 'transparent',
  },
  heroTitle: {
    color: '#F1F7EE',
  },
  heroSubtitle: {
    color: '#B7CCC2',
    lineHeight: 22,
    flexShrink: 1,
  },
  heroBadge: {
    minWidth: 104,
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#1F3C30',
    borderWidth: 1,
    borderColor: '#3D6B56',
    alignItems: 'center',
    gap: 4,
  },
  heroBadgeLabel: {
    color: '#98B7A7',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroBadgeValue: {
    color: '#7EE081',
    fontSize: 28,
    fontWeight: '700',
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  heroStatsColumn: {
    flexDirection: 'column',
  },
  heroStatCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#182D24',
    borderWidth: 1,
    borderColor: '#2A4A3D',
    gap: 4,
  },
  heroStatValue: {
    color: '#F1F7EE',
    fontSize: 28,
  },
  heroStatLabel: {
    color: '#8FB4A2',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  actionColumn: {
    flexDirection: 'column',
  },
  primaryActionButton: {
    flex: 1.2,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7EE081',
    borderWidth: 1,
    borderColor: '#A5F0AF',
  },
  actionButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  actionButtonDisabled: {
    opacity: 0.55,
  },
  primaryActionButtonText: {
    color: '#102218',
    fontSize: 15,
  },
  secondaryActionButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D3A2E',
    borderWidth: 1,
    borderColor: '#4FAF7A',
  },
  secondaryActionButtonText: {
    color: '#F3FBF6',
    fontSize: 15,
  },
  ghostActionButton: {
    minWidth: 94,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#162B22',
    borderWidth: 1,
    borderColor: '#547568',
  },
  ghostActionButtonText: {
    color: '#F0F8F3',
    fontSize: 15,
  },
  actionHelperText: {
    color: '#8FB4A2',
    lineHeight: 21,
    flexShrink: 1,
  },
  panelGrid: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  panelGridCompact: {
    flexDirection: 'column',
  },
  statusCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#152821',
    borderWidth: 1,
    borderColor: '#244338',
    gap: 10,
  },
  statusValue: {
    color: '#F1F7EE',
    fontSize: 28,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#F1F7EE',
    flexShrink: 1,
  },
  sectionSubtitle: {
    color: '#8FB4A2',
    lineHeight: 20,
    flexShrink: 1,
  },
  statusMessage: {
    color: '#C9DED2',
    lineHeight: 21,
    flexShrink: 1,
  },
  sectionCard: {
    borderRadius: 22,
    padding: 20,
    backgroundColor: '#14251F',
    borderWidth: 1,
    borderColor: '#244338',
    gap: 14,
  },
  sectionHeaderCopy: {
    minWidth: 0,
    gap: 6,
    backgroundColor: 'transparent',
  },
  feedbackCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#182D24',
    borderWidth: 1,
    borderColor: '#2A4A3D',
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
  habitList: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  habitCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#1A2E25',
    borderWidth: 1,
    borderColor: '#2F5244',
    gap: 10,
  },
  habitCardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  habitHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'transparent',
  },
  habitCopy: {
    flex: 1,
    gap: 4,
    backgroundColor: 'transparent',
  },
  habitTitle: {
    color: '#F1F7EE',
    fontSize: 18,
  },
  habitRoutineLabel: {
    color: '#8FB4A2',
  },
  habitTypeBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  habitTypeBadgeHabit: {
    backgroundColor: '#183524',
    borderColor: '#4FAF7A',
  },
  habitTypeBadgeTask: {
    backgroundColor: '#2A2E3C',
    borderColor: '#88B8FF',
  },
  habitTypeBadgeText: {
    fontSize: 12,
  },
  habitTypeBadgeTextHabit: {
    color: '#8DE2A8',
  },
  habitTypeBadgeTextTask: {
    color: '#B4D4FF',
  },
  habitDescription: {
    color: '#B7CCC2',
    lineHeight: 20,
  },
  habitMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'transparent',
  },
  metaChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#244338',
  },
  metaChipText: {
    color: '#BFE7D2',
    fontSize: 12,
  },
  habitStatsRow: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'transparent',
  },
  habitStatChip: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#20362C',
    borderWidth: 1,
    borderColor: '#325346',
    gap: 2,
  },
  habitStatValue: {
    color: '#F1F7EE',
    fontSize: 20,
    fontWeight: '700',
  },
  habitStatLabel: {
    color: '#8FB4A2',
    fontSize: 12,
  },
  historyRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'transparent',
  },
  historyDot: {
    flex: 1,
    height: 10,
    borderRadius: 999,
  },
  historyDotDone: {
    backgroundColor: '#7EE081',
  },
  historyDotOpen: {
    backgroundColor: '#314A40',
  },
  habitActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: 'transparent',
  },
  habitCheckoffButton: {
    flex: 1,
    minWidth: 170,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  habitCheckoffOpen: {
    backgroundColor: '#2B5642',
    borderColor: '#7CCF96',
  },
  habitCheckoffDone: {
    backgroundColor: '#3E6C4C',
    borderColor: '#A5F0AF',
  },
  habitCheckoffButtonText: {
    color: '#F3FBF6',
    fontSize: 14,
  },
  habitActionButtonPressed: {
    opacity: 0.9,
  },
  habitActionButtonDisabled: {
    opacity: 0.5,
  },
  habitSecondaryButton: {
    flex: 1,
    minWidth: 140,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#20362C',
    borderWidth: 1,
    borderColor: '#547568',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitSecondaryButtonText: {
    color: '#E2EEE8',
    fontSize: 14,
  },
  systemList: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  systemCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#1A2E25',
    borderWidth: 1,
    borderColor: '#2F5244',
  },
  systemCardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  systemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'transparent',
  },
  systemCopy: {
    flex: 1,
    gap: 6,
    backgroundColor: 'transparent',
  },
  systemTitle: {
    color: '#F1F7EE',
    fontSize: 18,
  },
  systemDescription: {
    color: '#B7CCC2',
    lineHeight: 20,
  },
  systemCountBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#244338',
  },
  systemCountText: {
    color: '#BFE7D2',
    fontSize: 12,
  },
});
