import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  AppState,
  type AppStateStatus,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { isAxiosError } from 'axios';
import { useFocusEffect } from '@react-navigation/native';

import { useCountdownTimer } from '@/hooks/use-countdown-timer';
import { FocusTreeVisual, type TreeStage } from '@/components/focus-tree-visual';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getUserIdFromToken } from '@/services/authStorage';
import {
  completeFocusSession,
  interruptFocusSession,
  startFocusSession,
  type FocusSession,
  type TreeType,
} from '@/services/focusSessionsApi';
import { getRoutinesByUser, type Routine } from '@/services/routinesApi';
import { getTasksByRoutine, type Task, type TaskCategory } from '@/services/tasksApi';

const parseTextParam = (value: string | string[] | undefined): string => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue ?? '';
};

const formatDurationHint = (durationText: string): string | null => {
  const parsed = Number.parseInt(durationText, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  if (parsed < 60) {
    return `Suggested focus block: ${parsed} min`;
  }

  const hours = Math.floor(parsed / 60);
  const minutes = parsed % 60;

  if (minutes === 0) {
    return `Suggested focus block: ${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
  }

  return `Suggested focus block: ${hours} ${hours === 1 ? 'hr' : 'hrs'} ${minutes} min`;
};

const getTreeStageLabel = (progressPercent: number): string => {
  if (progressPercent >= 75) {
    return 'Full-grown tree';
  }

  if (progressPercent >= 50) {
    return 'Half-grown tree';
  }

  if (progressPercent >= 25) {
    return 'Plant';
  }

  return 'Seed';
};

const getTreeStage = (progressPercent: number, isDamaged: boolean): TreeStage => {
  if (isDamaged) {
    if (progressPercent >= 50) {
      return 'half-grown';
    }

    if (progressPercent >= 25) {
      return 'plant';
    }

    return 'seed';
  }

  if (progressPercent >= 75) {
    return 'full-grown';
  }

  if (progressPercent >= 50) {
    return 'half-grown';
  }

  if (progressPercent >= 25) {
    return 'plant';
  }

  return 'seed';
};

const getTreeTypeFromTaskCategory = (category: TaskCategory | null | undefined): TreeType => {
  switch (category) {
    case 'WORK':
      return 'OAK';
    case 'STUDY':
      return 'BIRCH';
    case 'HEALTH':
      return 'PINE';
    case 'CREATIVE':
      return 'CHERRY_BLOSSOM';
    case 'GENERAL':
    default:
      return 'MAPLE';
  }
};

const formatTreeTypeLabel = (treeType: TreeType): string => {
  switch (treeType) {
    case 'OAK':
      return 'Oak';
    case 'BIRCH':
      return 'Birch';
    case 'PINE':
      return 'Pine';
    case 'CHERRY_BLOSSOM':
      return 'Cherry Blossom';
    case 'MAPLE':
    default:
      return 'Maple';
  }
};

export default function FocusSessionScreen() {
  const params = useLocalSearchParams<{
    taskId?: string;
    taskTitle?: string;
    taskDuration?: string;
  }>();

  const taskId = useMemo(() => Number(params.taskId), [params.taskId]);
  const taskTitle = useMemo(() => parseTextParam(params.taskTitle), [params.taskTitle]);
  const taskDuration = useMemo(() => parseTextParam(params.taskDuration), [params.taskDuration]);

  const [loading, setLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [availableRoutines, setAvailableRoutines] = useState<Routine[]>([]);
  const [tasksByRoutine, setTasksByRoutine] = useState<Record<number, Task[]>>({});
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(
    Number.isFinite(taskId) ? taskId : null,
  );
  const [session, setSession] = useState<FocusSession | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [lifecycleMessage, setLifecycleMessage] = useState('');
  const autoCompletingSessionRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const interruptingSessionRef = useRef(false);

  useEffect(() => {
    const loadTasks = async () => {
      setTasksLoading(true);

      try {
        const userId = await getUserIdFromToken();

        if (!userId) {
          setErrorMessage('Log in to choose a task for your focus session.');
          setAvailableRoutines([]);
          setTasksByRoutine({});
          return;
        }

        const routines = await getRoutinesByUser(userId);
        setAvailableRoutines(routines);

        const tasksEntries = await Promise.all(
          routines.map(async (routine) => [
            routine.id,
            await getTasksByRoutine(routine.id),
          ] as const),
        );

        setTasksByRoutine(Object.fromEntries(tasksEntries));
      } catch (error) {
        if (isAxiosError(error)) {
          const data = error.response?.data as
            | {
                error?: string;
                message?: string;
              }
            | undefined;

          setErrorMessage(data?.error || data?.message || 'Could not load tasks for focus mode.');
        } else {
          setErrorMessage('Could not load tasks for focus mode.');
        }
      } finally {
        setTasksLoading(false);
      }
    };

    void loadTasks();
  }, []);

  const availableTasks = useMemo(
    () => availableRoutines.flatMap((routine) => tasksByRoutine[routine.id] ?? []),
    [availableRoutines, tasksByRoutine],
  );

  const selectedTask = useMemo(() => {
    if (selectedTaskId == null) {
      return null;
    }

    return availableTasks.find((task) => task.id === selectedTaskId) ?? null;
  }, [availableTasks, selectedTaskId]);

  const fallbackSelectedTitle = selectedTask?.title ?? taskTitle;
  const fallbackSelectedDuration =
    selectedTask?.duration == null
      ? taskDuration
      : String(selectedTask.duration);
  const timerDurationSeconds = useMemo(() => {
    const parsedMinutes = Number.parseInt(fallbackSelectedDuration, 10);

    if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
      return 25 * 60;
    }

    return parsedMinutes * 60;
  }, [fallbackSelectedDuration]);
  const durationHint = useMemo(
    () => formatDurationHint(fallbackSelectedDuration),
    [fallbackSelectedDuration],
  );
  const {
    remainingSeconds,
    formattedTime,
    isRunning: isTimerRunning,
    pause,
    reset,
    start,
    stop,
  } = useCountdownTimer({
    initialSeconds: timerDurationSeconds,
    autoStart: false,
  });

  const interruptActiveSession = useCallback(
    async (message: string) => {
      if (!session || session.completed || session.interrupted || interruptingSessionRef.current) {
        return;
      }

      interruptingSessionRef.current = true;

      try {
        const response = await interruptFocusSession(session.id);
        setSession(response);
        setLifecycleMessage(message);
        stop();
      } catch (error) {
        if (isAxiosError(error)) {
          const data = error.response?.data as
            | {
                error?: string;
                message?: string;
              }
            | undefined;

          setErrorMessage(data?.error || data?.message || 'Could not mark session as interrupted.');
        } else {
          setErrorMessage('Could not mark session as interrupted.');
        }
      } finally {
        interruptingSessionRef.current = false;
      }
    },
    [session, stop],
  );

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const currentSessionIsActive = session != null && !session.completed && !session.interrupted;
      const previousState = appStateRef.current;

      appStateRef.current = nextAppState;

      if (!currentSessionIsActive) {
        return;
      }

      if (nextAppState === 'active' && previousState !== 'active') {
        setLifecycleMessage('App returned to the foreground. Resume when you are ready.');
        return;
      }

      if (nextAppState === 'inactive') {
        pause();
        void interruptActiveSession('Session interrupted because the app became inactive.');
        return;
      }

      if (nextAppState === 'background') {
        pause();
        void interruptActiveSession('Session interrupted because the app moved to the background.');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [interruptActiveSession, pause, session]);

  useFocusEffect(
    useCallback(
      () => () => {
        if (session && !session.completed && !session.interrupted) {
          pause();
          void interruptActiveSession('Session interrupted because you left the focus session screen.');
        }
      },
      [interruptActiveSession, pause, session],
    ),
  );

  const handleCompleteSession = useCallback(async () => {
    if (!session) {
      setErrorMessage('There is no active session to end.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await completeFocusSession(session.id);
      setSession(response);
      setLifecycleMessage('Session completed and saved.');
      stop();
    } catch (error) {
      if (isAxiosError(error)) {
        const data = error.response?.data as
          | {
              error?: string;
              message?: string;
            }
          | undefined;

        setErrorMessage(data?.error || data?.message || 'Could not end focus session.');
      } else {
        setErrorMessage('Could not end focus session.');
      }
    } finally {
      setLoading(false);
      autoCompletingSessionRef.current = false;
    }
  }, [session, stop]);

  useEffect(() => {
    if (!session) {
      stop();
      autoCompletingSessionRef.current = false;
      return;
    }

    if (session.completed || session.interrupted) {
      stop();
      autoCompletingSessionRef.current = false;
      return;
    }

    reset(timerDurationSeconds);
    start();
  }, [reset, session?.id, session?.completed, session?.interrupted, start, stop, timerDurationSeconds]);

  useEffect(() => {
    if (
      !session
      || session.completed
      || session.interrupted
      || remainingSeconds > 0
      || autoCompletingSessionRef.current
    ) {
      return;
    }

    autoCompletingSessionRef.current = true;
    setLifecycleMessage('Focus block finished. Completing your session...');
    void handleCompleteSession();
  }, [handleCompleteSession, remainingSeconds, session]);

  const formattedCompletedDuration = useMemo(() => {
    if (session?.duration == null) {
      return null;
    }

    return formatDurationHint(String(session.duration))?.replace('Suggested focus block: ', '')
      ?? `${session.duration} min`;
  }, [session]);

  const treeProgressPercent = useMemo(() => {
    if (session?.completed) {
      return 100;
    }

    if (session?.interrupted) {
      const interruptedProgress =
        timerDurationSeconds <= 0
          ? 0
          : ((timerDurationSeconds - remainingSeconds) / timerDurationSeconds) * 74;

      return Math.min(74, Math.max(0, interruptedProgress));
    }

    if (!session) {
      return 0;
    }

    const elapsedSeconds = Math.max(0, timerDurationSeconds - remainingSeconds);

    if (timerDurationSeconds <= 0) {
      return 0;
    }

    return Math.min(100, (elapsedSeconds / timerDurationSeconds) * 100);
  }, [remainingSeconds, session, timerDurationSeconds]);

  const treeStageLabel = useMemo(
    () => getTreeStageLabel(treeProgressPercent),
    [treeProgressPercent],
  );
  const treeStage = useMemo(
    () => getTreeStage(treeProgressPercent, session?.interrupted ?? false),
    [treeProgressPercent, session],
  );
  const treeType = useMemo<TreeType>(() => {
    if (session?.treeType) {
      return session.treeType;
    }

    return getTreeTypeFromTaskCategory(selectedTask?.category);
  }, [selectedTask, session]);
  const treeTypeLabel = useMemo(
    () => formatTreeTypeLabel(treeType),
    [treeType],
  );

  const treeStatusText = useMemo(() => {
    if (!session) {
      return `Start a session to begin growing your ${treeTypeLabel.toLowerCase()}.`;
    }

    if (session.interrupted) {
      return `The session was interrupted, so your ${treeTypeLabel.toLowerCase()} was damaged and can no longer reach full growth.`;
    }

    if (session.completed) {
      return `Your completed session has been turned into lasting ${treeTypeLabel.toLowerCase()} growth.`;
    }

    return `Your ${treeTypeLabel.toLowerCase()} is updating live as your focus time accumulates.`;
  }, [session, treeTypeLabel]);
  const hasTasksAvailable = availableTasks.length > 0;
  const canStartSession =
    !loading
    && !tasksLoading
    && hasTasksAvailable
    && selectedTaskId != null;

  const handleStartSession = async () => {
    if (!hasTasksAvailable) {
      setErrorMessage('Create a task before starting a focus session.');
      return;
    }

    if (selectedTaskId == null) {
      setErrorMessage('Choose a task before starting a focus session.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const userId = await getUserIdFromToken();

      if (!userId) {
        setErrorMessage('Log in to start a focus session.');
        return;
      }

      const response = await startFocusSession({
        userId,
        taskId: selectedTaskId,
      });

      setSession(response);
      setLifecycleMessage('');
      interruptingSessionRef.current = false;
      start();
    } catch (error) {
      if (isAxiosError(error)) {
        const data = error.response?.data as
          | {
              error?: string;
              message?: string;
            }
          | undefined;

        setErrorMessage(data?.error || data?.message || 'Could not start focus session.');
      } else {
        setErrorMessage('Could not start focus session.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.card}>
          <ThemedText type="title" style={styles.title}>
            Focus Session
          </ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            Start a distraction-free work block and keep your attention on one thing at a time.
          </ThemedText>

          <View style={styles.selectorPanel}>
            <ThemedText type="defaultSemiBold" style={styles.selectorTitle}>
              Choose a task
            </ThemedText>
            <ThemedText type="default" style={styles.selectorSubtitle}>
              Pick a task to anchor this session before you start focusing.
            </ThemedText>

            {tasksLoading ? (
              <ActivityIndicator size="small" color="#7EE081" />
            ) : !hasTasksAvailable ? (
              <View style={styles.emptyTaskState}>
                <ThemedText type="defaultSemiBold" style={styles.emptyTaskStateTitle}>
                  No tasks yet
                </ThemedText>
                <ThemedText type="default" style={styles.emptyTaskStateText}>
                  Create a task first, then come back to start a focus session.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.taskOptions}>
                {availableRoutines.map((routine) => {
                  const routineTasks = tasksByRoutine[routine.id] ?? [];

                  if (routineTasks.length === 0) {
                    return null;
                  }

                  return (
                    <View key={routine.id} style={styles.routineGroup}>
                      <ThemedText type="defaultSemiBold" style={styles.routineGroupTitle}>
                        {routine.title}
                      </ThemedText>

                      {routineTasks.map((task) => (
                        <Pressable
                          key={task.id}
                          style={({ pressed }) => [
                            styles.optionCard,
                            selectedTaskId === task.id && styles.optionCardSelected,
                            pressed && styles.optionCardPressed,
                          ]}
                          onPress={() => setSelectedTaskId(task.id)}
                        >
                          <ThemedText type="defaultSemiBold" style={styles.optionTitle}>
                            {task.title}
                          </ThemedText>
                          {task.description ? (
                            <ThemedText type="default" style={styles.optionText}>
                              {task.description}
                            </ThemedText>
                          ) : null}
                          {task.duration != null ? (
                            <ThemedText type="default" style={styles.optionMeta}>
                              {formatDurationHint(String(task.duration))?.replace('Suggested focus block: ', '')}
                            </ThemedText>
                          ) : null}
                        </Pressable>
                      ))}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.infoPanel}>
            <ThemedText type="defaultSemiBold" style={styles.infoLabel}>
              Focus target
            </ThemedText>
            <ThemedText type="default" style={styles.infoValue}>
              {fallbackSelectedTitle || 'No task selected yet'}
            </ThemedText>
            {durationHint ? (
              <ThemedText type="default" style={styles.helperText}>
                {durationHint}
              </ThemedText>
            ) : null}
            {lifecycleMessage ? (
              <ThemedText type="default" style={styles.lifecycleText}>
                {lifecycleMessage}
              </ThemedText>
            ) : null}
            {session ? (
              <View
                style={[
                  styles.statusBadge,
                  session.interrupted
                    ? styles.statusBadgeInterrupted
                    : session.completed
                      ? styles.statusBadgeCompleted
                      : styles.statusBadgeActive,
                ]}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={[
                    styles.statusBadgeText,
                    session.interrupted
                      ? styles.statusBadgeTextInterrupted
                      : session.completed
                        ? styles.statusBadgeTextCompleted
                        : styles.statusBadgeTextActive,
                  ]}
                >
                  {session.interrupted ? 'Interrupted' : session.completed ? 'Completed' : 'In progress'}
                </ThemedText>
              </View>
            ) : null}
          </View>

          <FocusTreeVisual
            progressPercent={treeProgressPercent}
            stage={treeStage}
            stageLabel={treeStageLabel}
            treeType={treeType}
            treeTypeLabel={treeTypeLabel}
            isCompleted={session?.completed ?? false}
            isDamaged={session?.interrupted ?? false}
          />
          <ThemedText type="default" style={styles.treeHelperText}>
            {treeStatusText}
          </ThemedText>

          {session ? (
            <View style={styles.successPanel}>
              <ThemedText type="defaultSemiBold" style={styles.successTitle}>
                {session.interrupted
                  ? 'Session interrupted'
                  : session.completed
                    ? 'Session completed'
                    : 'Session started'}
              </ThemedText>
              <ThemedText type="default" style={styles.successStateText}>
                State: {session.interrupted ? 'Interrupted' : session.completed ? 'Completed' : 'Active'}
              </ThemedText>
              <ThemedText type="default" style={styles.timerText}>
                Countdown: {formattedTime}
              </ThemedText>
              <ThemedText type="default" style={styles.successStateText}>
                Timer: {session.completed || session.interrupted ? 'Stopped' : isTimerRunning ? 'Running' : 'Idle'}
              </ThemedText>
              <ThemedText type="default" style={styles.successText}>
                Started: {new Date(session.startedAt).toLocaleString()}
              </ThemedText>
              {session.endedAt ? (
                <ThemedText type="default" style={styles.successText}>
                  Ended: {new Date(session.endedAt).toLocaleString()}
                </ThemedText>
              ) : null}
              {formattedCompletedDuration ? (
                <ThemedText type="default" style={styles.successText}>
                  Duration: {formattedCompletedDuration}
                </ThemedText>
              ) : null}

              <View style={styles.actions}>
                {!session.completed && !session.interrupted ? (
                  <>
                    <Pressable
                      style={({ pressed }) => [
                        styles.stopButton,
                        pressed && styles.buttonPressed,
                        loading && styles.buttonDisabled,
                      ]}
                      onPress={stop}
                      disabled={loading}
                    >
                      <ThemedText type="defaultSemiBold" style={styles.stopButtonText}>
                        Stop Timer
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.secondaryButton,
                        pressed && styles.buttonPressed,
                        loading && styles.buttonDisabled,
                      ]}
                      onPress={() => reset(timerDurationSeconds)}
                      disabled={loading}
                    >
                      <ThemedText type="defaultSemiBold" style={styles.secondaryButtonText}>
                        Reset Timer
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.endButton,
                        pressed && styles.buttonPressed,
                        loading && styles.buttonDisabled,
                      ]}
                      onPress={() => void handleCompleteSession()}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <ThemedText type="defaultSemiBold" style={styles.endButtonText}>
                          End Session
                        </ThemedText>
                      )}
                    </Pressable>
                  </>
                ) : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => router.back()}
                >
                  <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>
                    Back to task
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          ) : (
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
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                  !canStartSession && styles.buttonDisabled,
                ]}
                onPress={() => void handleStartSession()}
                disabled={!canStartSession}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>
                    Start Session
                  </ThemedText>
                )}
              </Pressable>
            </View>
          )}

          {errorMessage ? <ThemedText style={styles.errorText}>{errorMessage}</ThemedText> : null}
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
    padding: 24,
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
    gap: 16,
  },
  selectorPanel: {
    gap: 10,
    backgroundColor: 'transparent',
  },
  selectorTitle: {
    color: '#EAF6F0',
  },
  selectorSubtitle: {
    color: '#98B7A7',
  },
  taskOptions: {
    gap: 10,
    backgroundColor: 'transparent',
  },
  emptyTaskState: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#355648',
    backgroundColor: '#172923',
    padding: 16,
    gap: 6,
  },
  emptyTaskStateTitle: {
    color: '#EAF6F0',
  },
  emptyTaskStateText: {
    color: '#B7CCC2',
  },
  routineGroup: {
    gap: 8,
    backgroundColor: 'transparent',
  },
  routineGroupTitle: {
    color: '#7FA08E',
    marginTop: 4,
  },
  optionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#355648',
    backgroundColor: '#172923',
    padding: 14,
    gap: 4,
  },
  optionCardSelected: {
    borderColor: '#63C174',
    backgroundColor: '#204736',
  },
  optionCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  optionTitle: {
    color: '#EAF6F0',
  },
  optionText: {
    color: '#B7CCC2',
  },
  optionMeta: {
    color: '#7EE081',
  },
  title: {
    color: '#EAF6F0',
  },
  subtitle: {
    color: '#B7CCC2',
  },
  infoPanel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2B4A3E',
    backgroundColor: '#1A2D26',
    padding: 16,
    gap: 6,
  },
  infoLabel: {
    color: '#98B7A7',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  infoValue: {
    color: '#EAF6F0',
    fontSize: 18,
  },
  helperText: {
    color: '#7FA08E',
  },
  treeHelperText: {
    color: '#A7C8B7',
  },
  lifecycleText: {
    color: '#F2C66D',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 4,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: '#163824',
    borderColor: '#4FAF7A',
  },
  statusBadgeCompleted: {
    backgroundColor: '#1D3140',
    borderColor: '#6FB7FF',
  },
  statusBadgeInterrupted: {
    backgroundColor: '#3D2718',
    borderColor: '#F2C66D',
  },
  statusBadgeText: {
    fontSize: 12,
  },
  statusBadgeTextActive: {
    color: '#8DE2A8',
  },
  statusBadgeTextCompleted: {
    color: '#A9D4FF',
  },
  statusBadgeTextInterrupted: {
    color: '#F2C66D',
  },
  successPanel: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  successTitle: {
    color: '#7EE081',
  },
  successStateText: {
    color: '#B7CCC2',
  },
  timerText: {
    color: '#7EE081',
    fontSize: 20,
    fontWeight: '700',
  },
  successText: {
    color: '#EAF6F0',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
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
  stopButton: {
    flex: 1,
    backgroundColor: '#33414D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#738291',
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  endButton: {
    flex: 1,
    backgroundColor: '#B94A4A',
    borderWidth: 1,
    borderColor: '#E28787',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endButtonText: {
    color: '#FFFFFF',
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
  },
});
