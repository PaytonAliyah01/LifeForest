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
import { appColors, appSharedStyles } from '@/components/ui/app-theme';
import { getUserIdFromToken } from '@/services/authStorage';
import {
  completeFocusSession,
  interruptFocusSession,
  startFocusSession,
  type FocusSession,
  type TreeType,
} from '@/services/focusSessionsApi';
import { getReflectionByFocusSession } from '@/services/reflectionsApi';
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

const isTaskAvailableForFocus = (task: Task): boolean =>
  task.taskType === 'REPEATING' || !task.completed;

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
  const [hasReflection, setHasReflection] = useState(false);
  const autoCompletingSessionRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const interruptingSessionRef = useRef(false);
  const promptedReflectionSessionIdRef = useRef<number | null>(null);

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
    () =>
      availableRoutines.flatMap((routine) =>
        (tasksByRoutine[routine.id] ?? []).filter(isTaskAvailableForFocus),
      ),
    [availableRoutines, tasksByRoutine],
  );

  const selectedTask = useMemo(() => {
    if (selectedTaskId == null) {
      return null;
    }

    return availableTasks.find((task) => task.id === selectedTaskId) ?? null;
  }, [availableTasks, selectedTaskId]);

  useEffect(() => {
    if (selectedTaskId != null && selectedTask == null) {
      setSelectedTaskId(null);
    }
  }, [selectedTask, selectedTaskId]);

  useEffect(() => {
    if (tasksLoading || availableTasks.length === 0 || selectedTaskId != null) {
      return;
    }

    setSelectedTaskId(availableTasks[0].id);
  }, [availableTasks, selectedTaskId, tasksLoading]);

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

  const openReflectionScreen = useCallback(
    (focusSession: FocusSession, outcome: 'completed' | 'interrupted') => {
      if (promptedReflectionSessionIdRef.current === focusSession.id) {
        return;
      }

      promptedReflectionSessionIdRef.current = focusSession.id;

      router.replace({
        pathname: '/reflection' as never,
        params: {
          focusSessionId: String(focusSession.id),
          taskTitle: fallbackSelectedTitle || 'Focus session',
          outcome,
        } as never,
      });
    },
    [fallbackSelectedTitle],
  );

  const interruptActiveSession = useCallback(
    async (message: string) => {
      if (!session || session.completed || session.interrupted || interruptingSessionRef.current) {
        return null;
      }

      interruptingSessionRef.current = true;

      try {
        const response = await interruptFocusSession(session.id);
        setSession(response);
        setHasReflection(false);
        setLifecycleMessage(message);
        stop();
        return response;
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

      return null;
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
      setHasReflection(false);
      setLifecycleMessage('Session completed and saved.');
      stop();
      openReflectionScreen(response, 'completed');
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
  }, [openReflectionScreen, session, stop]);

  const handleEndSession = useCallback(async () => {
    if (!session) {
      setErrorMessage('There is no active session to end.');
      return;
    }

    if (remainingSeconds > 0) {
      pause();
      const interruptedSession = await interruptActiveSession(
        'Session ended early and was saved as interrupted.',
      );

      if (interruptedSession) {
        openReflectionScreen(interruptedSession, 'interrupted');
      }

      return;
    }

    await handleCompleteSession();
  }, [handleCompleteSession, interruptActiveSession, openReflectionScreen, pause, remainingSeconds, session]);

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

  useEffect(() => {
    const loadReflectionState = async () => {
      if (!session?.id || (!session.completed && !session.interrupted)) {
        setHasReflection(false);
        return;
      }

      try {
        const reflection = await getReflectionByFocusSession(session.id);
        setHasReflection(reflection != null);
      } catch {
        setHasReflection(false);
      }
    };

    void loadReflectionState();
  }, [session?.id, session?.completed, session?.interrupted]);

  useEffect(() => {
    if (!session || (!session.completed && !session.interrupted) || hasReflection) {
      return;
    }

    if (appStateRef.current !== 'active') {
      return;
    }

    const outcome = session.interrupted ? 'interrupted' : 'completed';
    openReflectionScreen(session, outcome);
  }, [hasReflection, openReflectionScreen, session]);

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
              <ActivityIndicator size="small" color={appColors.primary} />
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
                  const availableRoutineTasks = routineTasks.filter(isTaskAvailableForFocus);

                  if (availableRoutineTasks.length === 0) {
                    return null;
                  }

                  return (
                    <View key={routine.id} style={styles.routineGroup}>
                      <ThemedText type="defaultSemiBold" style={styles.routineGroupTitle}>
                        {routine.title}
                      </ThemedText>

                      {availableRoutineTasks.map((task) => (
                        <Pressable
                          key={task.id}
                          testID={`focus-task-option-${task.id}`}
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
                          <ThemedText type="default" style={styles.optionHelper}>
                            {task.taskType === 'REPEATING'
                              ? 'Repeating task'
                              : 'One-time task'}
                          </ThemedText>
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
                      testID="focus-stop-timer-button"
                      style={({ pressed }) => [
                        styles.stopButton,
                        styles.fullActionButton,
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
                      testID="focus-reset-timer-button"
                      style={({ pressed }) => [
                        styles.secondaryButton,
                        styles.fullActionButton,
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
                      testID="focus-end-session-button"
                      style={({ pressed }) => [
                        styles.endButton,
                        styles.fullActionButton,
                        pressed && styles.buttonPressed,
                        loading && styles.buttonDisabled,
                      ]}
                      onPress={() => void handleEndSession()}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color={appColors.dangerText} />
                      ) : (
                        <ThemedText type="defaultSemiBold" style={styles.endButtonText}>
                          {remainingSeconds > 0 ? 'End Session Early' : 'End Session'}
                        </ThemedText>
                      )}
                    </Pressable>
                  </>
                ) : null}

                <Pressable
                  testID="focus-back-to-task-button"
                  style={({ pressed }) => [
                    styles.primaryButton,
                    styles.fullActionButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => router.back()}
                  >
                  <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>
                    Back to task
                  </ThemedText>
                </Pressable>

                <Pressable
                  testID="focus-reflection-button"
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    styles.fullActionButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/reflection' as never,
                      params: {
                        focusSessionId: String(session.id),
                        taskTitle: fallbackSelectedTitle || 'Focus session',
                        outcome: session.interrupted ? 'interrupted' : session.completed ? 'completed' : 'active',
                      } as never,
                    })
                  }
                >
                  <ThemedText type="defaultSemiBold" style={styles.secondaryButtonText}>
                    {hasReflection ? 'View Reflection' : 'Add Reflection'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.actions}>
              {!hasTasksAvailable ? (
                <ThemedText type="default" style={styles.actionStatusText}>
                  Create a task first to unlock focus sessions.
                </ThemedText>
              ) : selectedTaskId == null ? (
                <ThemedText type="default" style={styles.actionStatusText}>
                  Choose a task above before starting your session.
                </ThemedText>
              ) : null}

              <Pressable
                testID="focus-cancel-button"
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
                testID="focus-start-session-button"
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                  !canStartSession && styles.buttonDisabled,
                ]}
                onPress={() => void handleStartSession()}
                disabled={!canStartSession}
              >
                {loading ? (
                  <ActivityIndicator color={appColors.dangerText} />
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
    ...appSharedStyles.screen,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: appColors.card,
    borderWidth: 1,
    borderColor: appColors.cardBorder,
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
    color: appColors.text,
  },
  selectorSubtitle: {
    color: appColors.subtleText,
  },
  taskOptions: {
    gap: 10,
    backgroundColor: 'transparent',
  },
  emptyTaskState: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: appColors.inputBorder,
    backgroundColor: appColors.panelSoft,
    padding: 16,
    gap: 6,
  },
  emptyTaskStateTitle: {
    color: appColors.text,
  },
  emptyTaskStateText: {
    color: appColors.mutedText,
  },
  routineGroup: {
    gap: 8,
    backgroundColor: 'transparent',
  },
  routineGroupTitle: {
    color: appColors.subtleText,
    marginTop: 4,
  },
  optionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: appColors.inputBorder,
    backgroundColor: appColors.panelSoft,
    padding: 14,
    gap: 4,
  },
  optionCardSelected: {
    borderColor: appColors.selectedPanelBorder,
    backgroundColor: appColors.selectedPanel,
  },
  optionCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  optionTitle: {
    color: appColors.text,
  },
  optionText: {
    color: appColors.mutedText,
  },
  optionMeta: {
    color: appColors.primary,
  },
  optionHelper: {
    color: appColors.subtleText,
  },
  title: {
    color: appColors.text,
  },
  subtitle: {
    color: appColors.mutedText,
  },
  infoPanel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.panelBorder,
    backgroundColor: appColors.panel,
    padding: 16,
    gap: 6,
  },
  infoLabel: {
    color: appColors.subtleText,
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  infoValue: {
    color: appColors.text,
    fontSize: 18,
  },
  helperText: {
    color: appColors.subtleText,
  },
  treeHelperText: {
    color: appColors.softText,
  },
  lifecycleText: {
    color: appColors.warningText,
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
    backgroundColor: appColors.greenPanel,
    borderColor: appColors.secondaryBorder,
  },
  statusBadgeCompleted: {
    backgroundColor: appColors.bluePanel,
    borderColor: appColors.blueBorder,
  },
  statusBadgeInterrupted: {
    backgroundColor: appColors.warningSurface,
    borderColor: appColors.warningBorder,
  },
  statusBadgeText: {
    fontSize: 12,
  },
  statusBadgeTextActive: {
    color: appColors.greenText,
  },
  statusBadgeTextCompleted: {
    color: appColors.blueText,
  },
  statusBadgeTextInterrupted: {
    color: appColors.warningText,
  },
  successPanel: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  successTitle: {
    color: appColors.success,
  },
  successStateText: {
    color: appColors.mutedText,
  },
  timerText: {
    color: appColors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  successText: {
    color: appColors.text,
  },
  actions: {
    flexDirection: 'column',
    gap: 10,
    backgroundColor: 'transparent',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: appColors.primary,
    borderWidth: 1,
    borderColor: appColors.primaryBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: appColors.secondary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: appColors.secondaryBorder,
    minHeight: 46,
  },
  primaryButtonText: {
    color: appColors.primaryText,
    fontSize: 14,
  },
  stopButton: {
    width: '100%',
    backgroundColor: appColors.bluePanel,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: appColors.blueBorder,
    minHeight: 46,
  },
  stopButtonText: {
    color: appColors.secondaryText,
    fontSize: 14,
  },
  endButton: {
    width: '100%',
    backgroundColor: appColors.danger,
    borderWidth: 1,
    borderColor: appColors.dangerBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  endButtonText: {
    color: appColors.dangerText,
    fontSize: 14,
  },
  secondaryButtonText: {
    color: appColors.secondaryText,
    fontSize: 14,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  fullActionButton: {
    width: '100%',
  },
  actionStatusText: {
    width: '100%',
    color: appColors.subtleText,
  },
  errorText: {
    color: appColors.error,
  },
});
