import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { isAxiosError } from 'axios';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { api } from '@/services/api';
import { getUserIdFromToken } from '@/services/authStorage';
import { getRoutinesByUser, type Routine } from '@/services/routinesApi';
import { getTasksByRoutine, type Task } from '@/services/tasksApi';
import { getTreesByUser } from '@/services/treesApi';

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

const getTreeMessage = (treeCount: number): string => {
  if (treeCount === 0) {
    return 'Your grove is waiting for its first tree.';
  }

  if (treeCount === 1) {
    return 'One tree is already standing in your forest.';
  }

  return `${treeCount} trees are growing in your forest.`;
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const [message, setMessage] = useState('');
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState('');
  const [routinesLoading, setRoutinesLoading] = useState(true);
  const [routinesError, setRoutinesError] = useState('');
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [tasksByRoutine, setTasksByRoutine] = useState<Record<number, Task[]>>({});
  const [treeCount, setTreeCount] = useState(0);

  const horizontalPadding = width < 380 ? 16 : width < 768 ? 24 : 32;
  const contentMaxWidth = width < 768 ? width - horizontalPadding * 2 : 940;
  const isCompact = width < 720;

  const totalTaskCount = useMemo(
    () => Object.values(tasksByRoutine).reduce((count, tasks) => count + tasks.length, 0),
    [tasksByRoutine],
  );
  const completedTaskCount = useMemo(
    () =>
      Object.values(tasksByRoutine).reduce(
        (count, tasks) => count + tasks.filter((task) => task.completed).length,
        0,
      ),
    [tasksByRoutine],
  );
  const activeRoutineCount = useMemo(
    () => routines.filter((routine) => !routine.completed).length,
    [routines],
  );

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);

    try {
      const response = await api.get<string>('/hello');
      setMessage(response.data);
      setStatusError('');
    } catch (error) {
      if (isAxiosError(error)) {
        console.log('Status fetch error:', error.message, error.response?.status, error.response?.data);
      } else {
        console.log('Status fetch error:', error);
      }

      setStatusError('Could not reach the backend status endpoint.');
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    setRoutinesLoading(true);
    setRoutinesError('');

    try {
      const userId = await getUserIdFromToken();

      if (!userId) {
        setRoutines([]);
        setTasksByRoutine({});
        setTreeCount(0);
        setRoutinesError('');
        return;
      }

      const [routinesResponse, treesResponse] = await Promise.all([
        getRoutinesByUser(userId),
        getTreesByUser(userId),
      ]);

      setRoutines(routinesResponse);
      setTreeCount(treesResponse.length);

      const tasksEntries = await Promise.all(
        routinesResponse.map(async (routine) => [
          routine.id,
          await getTasksByRoutine(routine.id),
        ] as const),
      );

      setTasksByRoutine(Object.fromEntries(tasksEntries));
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 404) {
          setRoutines([]);
          setTasksByRoutine({});
          setTreeCount(0);
          setRoutinesError('');
          return;
        }

        console.log('Dashboard fetch error:', error.message, error.response?.status, error.response?.data);
      } else {
        console.log('Dashboard fetch error:', error);
      }

      setRoutines([]);
      setTasksByRoutine({});
      setTreeCount(0);
      setRoutinesError('Could not load your routines and forest right now.');
    } finally {
      setRoutinesLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
    void fetchDashboard();
  }, [fetchDashboard, fetchStatus]);

  useFocusEffect(
    useCallback(() => {
      void fetchDashboard();
    }, [fetchDashboard]),
  );

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

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D6E6D7', dark: '#112018' }}
      headerImage={
        <View style={styles.headerArt}>
          <View style={styles.headerGlowLarge} />
          <View style={styles.headerGlowSmall} />
          <View style={styles.headerHillBack} />
          <View style={styles.headerHillFront} />
          <View style={styles.headerTreeTrunk} />
          <View style={styles.headerTreeCanopyMain} />
          <View style={styles.headerTreeCanopyLeft} />
          <View style={styles.headerTreeCanopyRight} />
        </View>
      }
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
                Grow focus into a forest.
              </ThemedText>
              <ThemedText style={styles.heroSubtitle}>
                Turn your routines, tasks, and focus sessions into something that feels alive instead of another checklist.
              </ThemedText>
            </View>

            <View style={styles.heroBadge}>
              <ThemedText type="defaultSemiBold" style={styles.heroBadgeLabel}>
                Forest
              </ThemedText>
              <ThemedText style={styles.heroBadgeValue}>{treeCount}</ThemedText>
            </View>
          </View>

          <View style={[styles.heroStatsRow, isCompact && styles.heroStatsColumn]}>
            <ThemedView style={styles.heroStatCard}>
              <ThemedText type="defaultSemiBold" style={styles.heroStatValue}>
                {activeRoutineCount}
              </ThemedText>
              <ThemedText style={styles.heroStatLabel}>Active routines</ThemedText>
            </ThemedView>
            <ThemedView style={styles.heroStatCard}>
              <ThemedText type="defaultSemiBold" style={styles.heroStatValue}>
                {totalTaskCount}
              </ThemedText>
              <ThemedText style={styles.heroStatLabel}>Tasks in motion</ThemedText>
            </ThemedView>
            <ThemedView style={styles.heroStatCard}>
              <ThemedText type="defaultSemiBold" style={styles.heroStatValue}>
                {completedTaskCount}
              </ThemedText>
              <ThemedText style={styles.heroStatLabel}>Tasks completed</ThemedText>
            </ThemedView>
          </View>

          <View style={[styles.actionRow, isCompact && styles.actionColumn]}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryActionButton,
                totalTaskCount === 0 && styles.actionButtonDisabled,
                pressed && totalTaskCount > 0 && styles.actionButtonPressed,
              ]}
              onPress={() => openFocusSession()}
              disabled={totalTaskCount === 0}
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
                Create Routine
              </ThemedText>
            </Pressable>

            <Pressable style={styles.ghostActionButton} onPress={() => void fetchDashboard()}>
              <ThemedText type="defaultSemiBold" style={styles.ghostActionButtonText}>
                Refresh
              </ThemedText>
            </Pressable>
          </View>

          {totalTaskCount === 0 ? (
            <ThemedText style={styles.actionHelperText}>
              Add a task before starting a focus session.
            </ThemedText>
          ) : null}
        </ThemedView>

        <View style={[styles.panelGrid, isCompact && styles.panelGridCompact]}>
          <ThemedView style={styles.statusCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              System Pulse
            </ThemedText>
            {statusLoading ? (
              <ActivityIndicator size="small" color="#7EE081" />
            ) : statusError ? (
              <ThemedText style={styles.errorText}>{statusError}</ThemedText>
            ) : (
              <ThemedText style={styles.statusMessage}>
                {message || 'Backend online.'}
              </ThemedText>
            )}
          </ThemedView>

          <ThemedView style={styles.statusCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Forest Outlook
            </ThemedText>
            <ThemedText style={styles.statusMessage}>{getTreeMessage(treeCount)}</ThemedText>
          </ThemedView>
        </View>

        <ThemedView style={styles.routinesSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderCopy}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Your Routines
              </ThemedText>
              <ThemedText style={styles.sectionSubtitle}>
                Keep the daily systems visible, and jump straight into the next useful thing.
              </ThemedText>
            </View>
          </View>

          {routinesLoading ? (
            <ThemedView style={styles.feedbackCard}>
              <ActivityIndicator size="small" color="#7EE081" />
              <ThemedText style={styles.feedbackText}>Loading your routines...</ThemedText>
            </ThemedView>
          ) : null}

          {!routinesLoading && routinesError ? (
            <ThemedView style={styles.feedbackCard}>
              <ThemedText style={styles.errorText}>{routinesError}</ThemedText>
            </ThemedView>
          ) : null}

          {!routinesLoading && !routinesError && routines.length === 0 ? (
            <ThemedView style={styles.feedbackCard}>
              <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                Nothing planted yet
              </ThemedText>
              <ThemedText style={styles.feedbackText}>
                Create your first routine and start turning attention into visible growth.
              </ThemedText>
            </ThemedView>
          ) : null}

          {!routinesLoading && !routinesError
            ? routines.map((routine) => {
                const tasks = tasksByRoutine[routine.id] ?? [];

                return (
                  <ThemedView key={routine.id} style={styles.routineCard}>
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
                            Add a description to make this routine feel more intentional.
                          </ThemedText>
                        )}
                      </View>

                      <View
                        style={[
                          styles.routineStateBadge,
                          routine.completed ? styles.routineStateDone : styles.routineStateActive,
                        ]}
                      >
                        <ThemedText
                          type="defaultSemiBold"
                          style={[
                            styles.routineStateText,
                            routine.completed
                              ? styles.routineStateTextDone
                              : styles.routineStateTextActive,
                          ]}
                        >
                          {routine.completed ? 'Completed' : 'Growing'}
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
                            onPress={() => openTaskEditor(task)}
                          >
                            <View style={styles.taskHeaderRow}>
                              <ThemedText type="defaultSemiBold" style={styles.taskTitle}>
                                {task.title}
                              </ThemedText>
                              <View style={styles.taskCategoryBadge}>
                                <ThemedText style={styles.taskCategoryText}>
                                  {formatCategoryLabel(task.category)}
                                </ThemedText>
                              </View>
                            </View>

                            {task.description ? (
                              <ThemedText style={styles.taskDescription}>
                                {task.description}
                              </ThemedText>
                            ) : null}

                            <View style={styles.taskMetaRow}>
                              {task.duration != null ? (
                                <ThemedText style={styles.taskDuration}>
                                  {formatTaskDuration(task.duration)}
                                </ThemedText>
                              ) : (
                                <ThemedText style={styles.taskDurationMuted}>
                                  No duration set
                                </ThemedText>
                              )}
                              <ThemedText style={styles.taskMetaState}>
                                {task.completed ? 'Completed' : 'Ready to focus'}
                              </ThemedText>
                            </View>

                            <Pressable
                              style={({ pressed }) => [
                                styles.taskActionButton,
                                pressed && styles.taskActionButtonPressed,
                              ]}
                              onPress={(event) => {
                                event.stopPropagation();
                                openFocusSession(task);
                              }}
                            >
                              <ThemedText type="defaultSemiBold" style={styles.taskActionButtonText}>
                                Start Session
                              </ThemedText>
                            </Pressable>
                          </Pressable>
                        ))
                      ) : (
                        <ThemedText style={styles.emptyTaskText}>
                          No tasks yet for this routine.
                        </ThemedText>
                      )}
                    </ThemedView>

                    <Pressable style={styles.routineActionButton} onPress={() => openRoutineEditor(routine)}>
                      <ThemedText type="defaultSemiBold" style={styles.routineActionButtonText}>
                        Edit Routine
                      </ThemedText>
                    </Pressable>
                  </ThemedView>
                );
              })
            : null}
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
  headerArt: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  headerGlowLarge: {
    position: 'absolute',
    top: 18,
    right: 38,
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: '#CFE4B6',
    opacity: 0.6,
  },
  headerGlowSmall: {
    position: 'absolute',
    top: 40,
    right: 125,
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: '#F3D28C',
    opacity: 0.75,
  },
  headerHillBack: {
    position: 'absolute',
    left: -50,
    right: -50,
    bottom: 34,
    height: 120,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    backgroundColor: '#5D8D5A',
    opacity: 0.75,
  },
  headerHillFront: {
    position: 'absolute',
    left: -30,
    right: -30,
    bottom: -12,
    height: 125,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    backgroundColor: '#2F5B41',
  },
  headerTreeTrunk: {
    position: 'absolute',
    bottom: 52,
    left: 62,
    width: 24,
    height: 110,
    borderRadius: 999,
    backgroundColor: '#6C4C2F',
  },
  headerTreeCanopyMain: {
    position: 'absolute',
    bottom: 122,
    left: 28,
    width: 92,
    height: 92,
    borderRadius: 999,
    backgroundColor: '#73B168',
    borderWidth: 3,
    borderColor: '#D1F1A9',
  },
  headerTreeCanopyLeft: {
    position: 'absolute',
    bottom: 108,
    left: -6,
    width: 78,
    height: 78,
    borderRadius: 999,
    backgroundColor: '#5E9D58',
    borderWidth: 3,
    borderColor: '#C2E89A',
  },
  headerTreeCanopyRight: {
    position: 'absolute',
    bottom: 108,
    left: 76,
    width: 78,
    height: 78,
    borderRadius: 999,
    backgroundColor: '#86C379',
    borderWidth: 3,
    borderColor: '#D8F2B3',
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
    color: '#B7CCC2',
    lineHeight: 22,
  },
  heroBadge: {
    minWidth: 88,
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
  sectionTitle: {
    color: '#F1F7EE',
  },
  sectionSubtitle: {
    color: '#8FB4A2',
    lineHeight: 20,
  },
  statusMessage: {
    color: '#C9DED2',
    lineHeight: 21,
  },
  routinesSection: {
    gap: 14,
    backgroundColor: 'transparent',
  },
  sectionHeaderRow: {
    backgroundColor: 'transparent',
  },
  sectionHeaderCopy: {
    gap: 6,
    backgroundColor: 'transparent',
  },
  feedbackCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#14251F',
    borderWidth: 1,
    borderColor: '#244338',
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
  routineCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#14251F',
    borderWidth: 1,
    borderColor: '#244338',
    gap: 14,
  },
  routineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: 'transparent',
  },
  routineHeaderCopy: {
    flex: 1,
    gap: 6,
    backgroundColor: 'transparent',
  },
  routineTitle: {
    color: '#F1F7EE',
    fontSize: 19,
  },
  routineDescription: {
    color: '#B7CCC2',
    lineHeight: 20,
  },
  routineDescriptionMuted: {
    color: '#7FA08E',
    fontStyle: 'italic',
  },
  routineStateBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  routineStateActive: {
    backgroundColor: '#183524',
    borderColor: '#4FAF7A',
  },
  routineStateDone: {
    backgroundColor: '#233140',
    borderColor: '#88B8FF',
  },
  routineStateText: {
    fontSize: 12,
  },
  routineStateTextActive: {
    color: '#8DE2A8',
  },
  routineStateTextDone: {
    color: '#B4D4FF',
  },
  routineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  routineMetaText: {
    color: '#8FB4A2',
  },
  routineMetaDivider: {
    color: '#4D6B5D',
  },
  tasksSection: {
    gap: 10,
    backgroundColor: 'transparent',
  },
  taskCard: {
    borderRadius: 16,
    padding: 14,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
  },
  taskTitle: {
    flex: 1,
    color: '#F1F7EE',
  },
  taskCategoryBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#244338',
  },
  taskCategoryText: {
    color: '#BFE7D2',
    fontSize: 12,
  },
  taskDescription: {
    color: '#A7C8B7',
    lineHeight: 20,
  },
  taskMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
  },
  taskDuration: {
    color: '#8DE2A8',
  },
  taskDurationMuted: {
    color: '#739181',
  },
  taskMetaState: {
    color: '#8FB4A2',
  },
  taskActionButton: {
    marginTop: 2,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2B5642',
    borderWidth: 1,
    borderColor: '#7CCF96',
  },
  taskActionButtonPressed: {
    opacity: 0.9,
  },
  taskActionButtonText: {
    color: '#F3FBF6',
    fontSize: 14,
  },
  emptyTaskText: {
    color: '#7FA08E',
  },
  routineActionButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#1D3A2E',
    borderWidth: 1,
    borderColor: '#4FAF7A',
  },
  routineActionButtonText: {
    color: '#F3FBF6',
    fontSize: 14,
  },
});
