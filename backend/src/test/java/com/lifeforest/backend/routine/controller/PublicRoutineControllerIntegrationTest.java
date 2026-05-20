package com.lifeforest.backend.routine.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.lifeforest.backend.routine.domain.Routine;
import com.lifeforest.backend.routine.repository.RoutineRepository;
import com.lifeforest.backend.task.domain.Task;
import com.lifeforest.backend.task.repository.TaskRepository;
import com.lifeforest.backend.user.domain.User;
import com.lifeforest.backend.user.repository.UserRepository;
import java.util.HashSet;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PublicRoutineControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoutineRepository routineRepository;

    @Autowired
    private TaskRepository taskRepository;

    @BeforeEach
    void clearData() {
        taskRepository.deleteAll();
        routineRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void deleteRoutineByIdReturnsNoContentAndDeletesRoutineWithTasks() throws Exception {
        User savedUser = userRepository.save(User.builder()
            .email("delete-test@example.com")
            .passwordHash("hashed-password")
            .displayName("Delete Test")
            .routines(new HashSet<>())
            .build());

        Routine savedRoutine = routineRepository.save(Routine.builder()
            .user(savedUser)
            .title("Evening reset")
            .description("Tidy and reflect")
            .completed(false)
            .build());

        Task savedTask = taskRepository.save(Task.builder()
            .routine(savedRoutine)
            .title("Close laptop")
            .description("Wrap up work")
            .completed(false)
            .build());

        mockMvc.perform(delete("/api/routines/{id}", savedRoutine.getId()))
            .andExpect(status().isNoContent());

        org.junit.jupiter.api.Assertions.assertFalse(
            routineRepository.findById(savedRoutine.getId()).isPresent()
        );
        org.junit.jupiter.api.Assertions.assertFalse(
            taskRepository.findById(savedTask.getId()).isPresent()
        );
    }

    @Test
    void deleteRoutineByIdReturnsNotFoundWhenRoutineDoesNotExist() throws Exception {
        mockMvc.perform(delete("/api/routines/{id}", 99999L))
            .andExpect(status().isNotFound());
    }
}
