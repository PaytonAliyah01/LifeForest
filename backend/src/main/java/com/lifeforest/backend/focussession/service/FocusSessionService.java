package com.lifeforest.backend.focussession.service;

import com.lifeforest.backend.common.security.AuthenticatedUserService;
import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.focussession.exception.FocusSessionInterruptedException;
import com.lifeforest.backend.focussession.exception.FocusSessionNotFoundException;
import com.lifeforest.backend.focussession.repository.FocusSessionRepository;
import com.lifeforest.backend.task.domain.Task;
import com.lifeforest.backend.task.domain.TaskType;
import com.lifeforest.backend.task.exception.TaskNotFoundException;
import com.lifeforest.backend.task.repository.TaskRepository;
import com.lifeforest.backend.tree.service.TreeService;
import com.lifeforest.backend.user.domain.User;
import com.lifeforest.backend.user.exception.UserNotFoundException;
import com.lifeforest.backend.user.repository.UserRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FocusSessionService {

    private static final String FOCUS_SESSION = "focusSession";

    private final FocusSessionRepository focusSessionRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final TreeService treeService;
    private final AuthenticatedUserService authenticatedUserService;

    @Transactional
    public FocusSession create(FocusSession focusSession) {
        FocusSession sessionToSave = prepareSession(focusSession);
        return focusSessionRepository.save(Objects.requireNonNull(sessionToSave, FOCUS_SESSION));
    }

    @Transactional
    public FocusSession start(Long userId, Long taskId) {
        authenticatedUserService.assertCanAccessUserId(userId);
        User user = loadUser(userId);
        Task task = taskId == null ? null : loadTask(taskId);

        validateTaskOwnership(user, task);
        validateTaskAvailability(task);

        FocusSession focusSession = FocusSession.builder()
                .user(user)
                .task(task)
                .treeType(treeService.determineTreeType(task))
                .startedAt(java.time.Instant.now())
                .completed(false)
                .interrupted(false)
                .build();

        return focusSessionRepository.save(focusSession);
    }

    @Transactional
    public FocusSession complete(Long focusSessionId) {
        FocusSession focusSession = loadFocusSession(focusSessionId);
        authenticatedUserService.assertCanAccessFocusSession(focusSession);

        if (focusSession.isCompleted()) {
            treeService.createForCompletedSession(focusSession);
            return focusSession;
        }

        if (focusSession.isInterrupted()) {
            throw new FocusSessionInterruptedException(focusSessionId);
        }

        Instant endedAt = Instant.now();
        focusSession.setEndedAt(endedAt);
        focusSession.setCompleted(true);
        focusSession.setDuration(calculateDurationMinutes(focusSession.getStartedAt(), endedAt));

        FocusSession savedSession = focusSessionRepository.save(focusSession);
        updateTaskCompletion(savedSession.getTask());
        treeService.createForCompletedSession(savedSession);
        return savedSession;
    }

    @Transactional
    public FocusSession interrupt(Long focusSessionId) {
        FocusSession focusSession = loadFocusSession(focusSessionId);
        authenticatedUserService.assertCanAccessFocusSession(focusSession);

        if (focusSession.isCompleted()) {
            return focusSession;
        }

        if (focusSession.isInterrupted()) {
            treeService.createForInterruptedSession(focusSession);
            return focusSession;
        }

        Instant endedAt = Instant.now();
        focusSession.setEndedAt(endedAt);
        focusSession.setInterrupted(true);
        focusSession.setCompleted(false);
        focusSession.setDuration(calculateDurationMinutes(focusSession.getStartedAt(), endedAt));

        FocusSession savedSession = focusSessionRepository.save(focusSession);
        treeService.createForInterruptedSession(savedSession);
        return savedSession;
    }

    @Transactional(readOnly = true)
    public List<FocusSession> getAll() {
        return getAllByUser(authenticatedUserService.getCurrentUser().getId());
    }

    @Transactional(readOnly = true)
    public List<FocusSession> getAllByUser(Long userId) {
        authenticatedUserService.assertCanAccessUserId(userId);
        loadUser(userId);
        return focusSessionRepository.findAllByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<FocusSession> getAllByTask(Long taskId) {
        Task task = loadTask(taskId);
        authenticatedUserService.assertCanAccessTask(task);
        return focusSessionRepository.findAllByTaskId(taskId);
    }

    @Transactional(readOnly = true)
    public FocusSession getById(Long focusSessionId) {
        FocusSession focusSession = loadFocusSession(focusSessionId);
        authenticatedUserService.assertCanAccessFocusSession(focusSession);
        return focusSession;
    }

    @Transactional
    public FocusSession update(Long focusSessionId, FocusSession focusSession) {
        FocusSession existingSession = loadFocusSession(focusSessionId);
        User user = resolveUser(focusSession);
        Task task = resolveTask(focusSession);

        existingSession.setUser(user);
        existingSession.setTask(task);
        existingSession.setTreeType(focusSession.getTreeType());
        existingSession.setStartedAt(focusSession.getStartedAt());
        existingSession.setEndedAt(focusSession.getEndedAt());
        existingSession.setDuration(focusSession.getDuration());
        existingSession.setCompleted(focusSession.isCompleted());
        existingSession.setInterrupted(focusSession.isInterrupted());

        validateTaskOwnership(user, task);

        return focusSessionRepository.save(existingSession);
    }

    @Transactional
    public void delete(Long focusSessionId) {
        FocusSession focusSession = loadFocusSession(focusSessionId);
        authenticatedUserService.assertCanAccessFocusSession(focusSession);
        focusSessionRepository.delete(Objects.requireNonNull(focusSession, FOCUS_SESSION));
    }

    private FocusSession prepareSession(FocusSession focusSession) {
        FocusSession session = Objects.requireNonNull(focusSession, FOCUS_SESSION);
        User user = resolveUser(session);
        Task task = resolveTask(session);

        session.setUser(user);
        session.setTask(task);
        validateTaskOwnership(user, task);

        return session;
    }

    private FocusSession loadFocusSession(Long focusSessionId) {
        return focusSessionRepository.findById(Objects.requireNonNull(focusSessionId, "focusSessionId"))
                .orElseThrow(() -> new FocusSessionNotFoundException(focusSessionId));
    }

    private User resolveUser(FocusSession focusSession) {
        Long userId = Objects.requireNonNull(
                Objects.requireNonNull(focusSession.getUser(), "focusSession.user").getId(),
                "focusSession.user.id"
        );

        return loadUser(userId);
    }

    private Task resolveTask(FocusSession focusSession) {
        if (focusSession.getTask() == null || focusSession.getTask().getId() == null) {
            return null;
        }

        return loadTask(focusSession.getTask().getId());
    }

    private User loadUser(Long userId) {
        return userRepository.findById(Objects.requireNonNull(userId, "userId"))
                .orElseThrow(() -> new UserNotFoundException(userId));
    }

    private Task loadTask(Long taskId) {
        return taskRepository.findById(Objects.requireNonNull(taskId, "taskId"))
                .orElseThrow(() -> new TaskNotFoundException(taskId));
    }

    private void validateTaskOwnership(User user, Task task) {
        if (task == null) {
            return;
        }

        Long taskOwnerId = task.getRoutine().getUser().getId();
        if (!taskOwnerId.equals(user.getId())) {
            throw new IllegalArgumentException("Task does not belong to the selected user.");
        }
    }

    private void validateTaskAvailability(Task task) {
        if (task == null) {
            return;
        }

        if (task.getTaskType() == TaskType.ONE_TIME && task.isCompleted()) {
            throw new IllegalArgumentException("This one-time task is already completed.");
        }
    }

    private void updateTaskCompletion(Task task) {
        if (task == null) {
            return;
        }

        if (task.getTaskType() == TaskType.ONE_TIME) {
            task.setCompleted(true);
        } else {
            task.setCompleted(false);
        }
    }

    private int calculateDurationMinutes(Instant startedAt, Instant endedAt) {
        Objects.requireNonNull(startedAt, "focusSession.startedAt");
        Objects.requireNonNull(endedAt, "endedAt");

        long durationMinutes = Math.max(0, Duration.between(startedAt, endedAt).toMinutes());
        return Math.toIntExact(durationMinutes);
    }
}
