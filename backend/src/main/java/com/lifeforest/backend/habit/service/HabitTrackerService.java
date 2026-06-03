package com.lifeforest.backend.habit.service;

import com.lifeforest.backend.habit.dto.response.TodayHabitResponseDto;
import com.lifeforest.backend.habitcompletion.domain.HabitCompletion;
import com.lifeforest.backend.habitcompletion.repository.HabitCompletionRepository;
import com.lifeforest.backend.task.domain.RepeatDay;
import com.lifeforest.backend.task.domain.Task;
import com.lifeforest.backend.task.domain.TaskType;
import com.lifeforest.backend.task.exception.TaskNotFoundException;
import com.lifeforest.backend.task.repository.TaskRepository;
import com.lifeforest.backend.user.domain.User;
import com.lifeforest.backend.user.exception.UserNotFoundException;
import com.lifeforest.backend.user.repository.UserRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HabitTrackerService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final HabitCompletionRepository habitCompletionRepository;

    @Transactional(readOnly = true)
    public List<TodayHabitResponseDto> getTodayHabits(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        LocalDate today = LocalDate.now();

        return user.getRoutines().stream()
                .flatMap(routine -> routine.getTasks().stream())
                .filter(task -> task.getTaskType() == TaskType.REPEATING)
                .filter(task -> isDueToday(task, today))
                .map(task -> toTodayHabitResponse(task, today))
                .sorted(Comparator
                        .comparing(TodayHabitResponseDto::completedToday)
                        .thenComparing(TodayHabitResponseDto::preferredTime, Comparator.nullsLast(String::compareTo))
                        .thenComparing(TodayHabitResponseDto::title))
                .toList();
    }

    @Transactional
    public TodayHabitResponseDto completeToday(Long userId, Long taskId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        Task task = loadRepeatingTaskForUser(taskId, userId);
        LocalDate today = LocalDate.now();

        habitCompletionRepository.findByTaskIdAndCompletedOn(task.getId(), today)
                .orElseGet(() -> habitCompletionRepository.save(HabitCompletion.builder()
                        .user(user)
                        .task(task)
                        .completedOn(today)
                        .build()));

        return toTodayHabitResponse(task, today);
    }

    @Transactional
    public TodayHabitResponseDto uncompleteToday(Long userId, Long taskId) {
        Task task = loadRepeatingTaskForUser(taskId, userId);
        LocalDate today = LocalDate.now();

        habitCompletionRepository.deleteByTaskIdAndCompletedOn(task.getId(), today);
        return toTodayHabitResponse(task, today);
    }

    private Task loadRepeatingTaskForUser(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));

        if (!task.getRoutine().getUser().getId().equals(userId) || task.getTaskType() != TaskType.REPEATING) {
            throw new TaskNotFoundException(taskId);
        }

        return task;
    }

    private TodayHabitResponseDto toTodayHabitResponse(Task task, LocalDate today) {
        List<HabitCompletion> completions = habitCompletionRepository.findAllByTaskId(task.getId());
        Set<LocalDate> completedDates = completions.stream()
                .map(HabitCompletion::getCompletedOn)
                .collect(Collectors.toSet());

        return new TodayHabitResponseDto(
                task.getId(),
                task.getRoutine().getId(),
                task.getRoutine().getTitle(),
                task.getTitle(),
                task.getDescription(),
                task.getDuration(),
                task.getCategory(),
                task.getRepeatDays(),
                task.getPreferredTime(),
                completedDates.contains(today),
                calculateCurrentStreak(task, completedDates, today),
                calculateWeeklyCompletionCount(completedDates, today),
                buildRecentCompletedDates(completedDates, today)
        );
    }

    private boolean isDueToday(Task task, LocalDate date) {
        Set<RepeatDay> repeatDays = task.getRepeatDays();

        if (repeatDays == null || repeatDays.isEmpty()) {
            return true;
        }

        return repeatDays.contains(toRepeatDay(date.getDayOfWeek()));
    }

    private int calculateCurrentStreak(Task task, Set<LocalDate> completedDates, LocalDate today) {
        LocalDate cursor = today;

        if (isDueToday(task, today) && !completedDates.contains(today)) {
            return 0;
        }

        if (!isDueToday(task, today)) {
            cursor = findPreviousDueDate(task, today.minusDays(1));
        }

        int streak = 0;

        while (cursor != null) {
            if (!completedDates.contains(cursor)) {
                break;
            }

            streak++;
            cursor = findPreviousDueDate(task, cursor.minusDays(1));
        }

        return streak;
    }

    private int calculateWeeklyCompletionCount(Set<LocalDate> completedDates, LocalDate today) {
        LocalDate threshold = today.minusDays(6);

        return (int) completedDates.stream()
                .filter(date -> !date.isBefore(threshold) && !date.isAfter(today))
                .count();
    }

    private List<String> buildRecentCompletedDates(Set<LocalDate> completedDates, LocalDate today) {
        LocalDate threshold = today.minusDays(6);

        return completedDates.stream()
                .filter(date -> !date.isBefore(threshold) && !date.isAfter(today))
                .sorted()
                .map(LocalDate::toString)
                .toList();
    }

    private LocalDate findPreviousDueDate(Task task, LocalDate start) {
        LocalDate cursor = start;

        for (int i = 0; i < 14; i++) {
            if (isDueToday(task, cursor)) {
                return cursor;
            }
            cursor = cursor.minusDays(1);
        }

        return null;
    }

    private RepeatDay toRepeatDay(DayOfWeek dayOfWeek) {
        return RepeatDay.valueOf(dayOfWeek.name());
    }
}
