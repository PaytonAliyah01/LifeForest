package com.lifeforest.backend.task.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.lifeforest.backend.common.security.AuthenticatedUserService;
import com.lifeforest.backend.routine.domain.Routine;
import com.lifeforest.backend.routine.repository.RoutineRepository;
import com.lifeforest.backend.task.domain.Task;
import com.lifeforest.backend.task.domain.TaskCategory;
import com.lifeforest.backend.task.domain.RepeatDay;
import com.lifeforest.backend.task.domain.TaskType;
import com.lifeforest.backend.task.dto.request.TaskCreateRequestDto;
import com.lifeforest.backend.task.dto.response.TaskResponseDto;
import com.lifeforest.backend.task.mapper.TaskMapper;
import com.lifeforest.backend.task.repository.TaskRepository;
import com.lifeforest.backend.user.domain.User;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private RoutineRepository routineRepository;

    @Mock
    private AuthenticatedUserService authenticatedUserService;

    private final TaskMapper taskMapper = new TaskMapper();

    private TaskService taskService;

    @BeforeEach
    void setUp() {
        taskService = new TaskService(taskRepository, routineRepository, taskMapper, authenticatedUserService);
    }

    @Test
    void createLinksTaskToRoutineAndReturnsResponse() {
        Routine routine = Routine.builder()
            .id(10L)
            .user(User.builder().id(3L).build())
            .tasks(new HashSet<>())
            .title("Focus")
            .description("Morning work")
            .completed(false)
            .build();

        TaskCreateRequestDto dto = new TaskCreateRequestDto(
            " Prepare desk ",
            " Clear the workspace ",
            25,
            TaskCategory.WORK,
            TaskType.REPEATING,
            Set.of(RepeatDay.MONDAY, RepeatDay.WEDNESDAY),
            "07:30"
        );

        when(routineRepository.findById(10L)).thenReturn(Optional.of(routine));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task task = invocation.getArgument(0);
            task.setId(55L);
            return task;
        });

        TaskResponseDto response = taskService.create(10L, dto);

        assertEquals(55L, response.id());
        assertEquals(10L, response.routineId());
        assertEquals("Prepare desk", response.title());
        assertEquals("Clear the workspace", response.description());
        assertEquals(25, response.duration());
        assertEquals(TaskCategory.WORK, response.category());
        assertEquals(TaskType.REPEATING, response.taskType());
        assertEquals(Set.of(RepeatDay.MONDAY, RepeatDay.WEDNESDAY), response.repeatDays());
        assertEquals("07:30", response.preferredTime());
        assertEquals(1, routine.getTasks().size());

        Task linkedTask = routine.getTasks().iterator().next();
        assertSame(routine, linkedTask.getRoutine());

        ArgumentCaptor<Task> taskCaptor = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository).save(taskCaptor.capture());
        assertSame(routine, taskCaptor.getValue().getRoutine());
        assertEquals("Prepare desk", taskCaptor.getValue().getTitle());
        assertEquals(25, taskCaptor.getValue().getDuration());
        assertEquals(TaskCategory.WORK, taskCaptor.getValue().getCategory());
        assertEquals(TaskType.REPEATING, taskCaptor.getValue().getTaskType());
        assertEquals(Set.of(RepeatDay.MONDAY, RepeatDay.WEDNESDAY), taskCaptor.getValue().getRepeatDays());
        assertEquals("07:30", taskCaptor.getValue().getPreferredTime());
    }

    @Test
    void deleteRemovesTaskFromRoutineBeforeDeleting() {
        Routine routine = Routine.builder()
            .id(12L)
            .user(User.builder().id(4L).build())
            .tasks(new HashSet<>())
            .title("Reset")
            .description("Wrap up")
            .completed(false)
            .build();

        Task task = Task.builder()
            .id(77L)
            .routine(routine)
            .title("Close tabs")
            .description("Browser cleanup")
            .completed(false)
            .build();

        routine.addTask(task);

        when(taskRepository.findById(77L)).thenReturn(Optional.of(task));

        taskService.delete(12L, 77L);

        assertTrue(routine.getTasks().isEmpty());
        assertFalse(routine.getTasks().contains(task));
        verify(taskRepository).delete(task);
    }
}
