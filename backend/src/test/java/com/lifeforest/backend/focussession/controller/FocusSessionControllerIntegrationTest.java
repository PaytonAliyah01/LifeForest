package com.lifeforest.backend.focussession.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.focussession.repository.FocusSessionRepository;
import com.lifeforest.backend.routine.domain.Routine;
import com.lifeforest.backend.routine.repository.RoutineRepository;
import com.lifeforest.backend.task.domain.Task;
import com.lifeforest.backend.task.domain.TaskCategory;
import com.lifeforest.backend.task.repository.TaskRepository;
import com.lifeforest.backend.tree.domain.Tree;
import com.lifeforest.backend.tree.domain.TreeType;
import com.lifeforest.backend.tree.repository.TreeRepository;
import com.lifeforest.backend.user.domain.User;
import com.lifeforest.backend.user.repository.UserRepository;
import java.time.Duration;
import java.util.HashSet;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class FocusSessionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FocusSessionRepository focusSessionRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private RoutineRepository routineRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TreeRepository treeRepository;

    @BeforeEach
    void clearData() {
        treeRepository.deleteAll();
        focusSessionRepository.deleteAll();
        taskRepository.deleteAll();
        routineRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void startAndCompleteSessionPersistsCompletedState() throws Exception {
        User savedUser = userRepository.save(User.builder()
                .email("focus-test@example.com")
                .passwordHash("hashed-password")
                .displayName("Focus Tester")
                .routines(new HashSet<>())
                .focusSessions(new HashSet<>())
                .build());

        Routine savedRoutine = routineRepository.save(Routine.builder()
                .user(savedUser)
                .title("Deep work")
                .description("Morning block")
                .completed(false)
                .build());

        Task savedTask = taskRepository.save(Task.builder()
                .routine(savedRoutine)
                .title("Write report")
                .description("Finish draft")
                .category(TaskCategory.WORK)
                .completed(false)
                .build());

        mockMvc.perform(post("/api/focus-sessions/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": %d,
                                  "taskId": %d
                                }
                                """.formatted(savedUser.getId(), savedTask.getId())))
                .andExpect(status().isCreated());

        assertEquals(1, focusSessionRepository.count());

        FocusSession startedSession = focusSessionRepository.findAll().getFirst();
        assertEquals(savedUser.getId(), startedSession.getUser().getId());
        assertEquals(savedTask.getId(), startedSession.getTask().getId());
        assertFalse(startedSession.isCompleted());
        assertFalse(startedSession.isInterrupted());
        assertEquals(TreeType.OAK, startedSession.getTreeType());
        assertNotNull(startedSession.getStartedAt());
        assertNull(startedSession.getEndedAt());
        assertNull(startedSession.getDuration());

        startedSession.setStartedAt(startedSession.getStartedAt().minus(Duration.ofMinutes(55)).minusSeconds(5));
        focusSessionRepository.save(startedSession);

        mockMvc.perform(post("/api/focus-sessions/{id}/complete", startedSession.getId()))
                .andExpect(status().isOk());

        FocusSession completedSession = focusSessionRepository.findById(startedSession.getId()).orElseThrow();
        assertTrue(completedSession.isCompleted());
        assertFalse(completedSession.isInterrupted());
        assertNotNull(completedSession.getEndedAt());
        assertNotNull(completedSession.getDuration());
        assertEquals(55, completedSession.getDuration());

        Tree createdTree = treeRepository.findByFocusSessionId(completedSession.getId()).orElseThrow();
        assertEquals(savedUser.getId(), createdTree.getUser().getId());
        assertEquals(completedSession.getId(), createdTree.getFocusSession().getId());
        assertEquals("Oak", createdTree.getSpecies());
        assertEquals(TreeType.OAK, createdTree.getTreeType());
        assertEquals(55, createdTree.getGrowthProgress());
        assertEquals(2, createdTree.getGrowthStage());
        assertFalse(createdTree.isDamaged());
        assertFalse(createdTree.isCompleted());
    }

    @Test
    void completedLongSessionStoresFullGrownTreeStage() throws Exception {
        User savedUser = userRepository.save(User.builder()
                .email("focus-full-grown@example.com")
                .passwordHash("hashed-password")
                .displayName("Full Grown Focus")
                .routines(new HashSet<>())
                .focusSessions(new HashSet<>())
                .build());

        Routine savedRoutine = routineRepository.save(Routine.builder()
                .user(savedUser)
                .title("Long session")
                .description("Grow a full tree")
                .completed(false)
                .build());

        Task savedTask = taskRepository.save(Task.builder()
                .routine(savedRoutine)
                .title("Deep study")
                .description("Stay with it")
                .category(TaskCategory.STUDY)
                .completed(false)
                .build());

        mockMvc.perform(post("/api/focus-sessions/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": %d,
                                  "taskId": %d
                                }
                                """.formatted(savedUser.getId(), savedTask.getId())))
                .andExpect(status().isCreated());

        FocusSession startedSession = focusSessionRepository.findAll().getFirst();
        startedSession.setStartedAt(startedSession.getStartedAt().minus(Duration.ofMinutes(125)));
        focusSessionRepository.save(startedSession);

        mockMvc.perform(post("/api/focus-sessions/{id}/complete", startedSession.getId()))
                .andExpect(status().isOk());

        Tree createdTree = treeRepository.findByFocusSessionId(startedSession.getId()).orElseThrow();
        assertEquals(TreeType.BIRCH, createdTree.getTreeType());
        assertEquals(100, createdTree.getGrowthProgress());
        assertEquals(3, createdTree.getGrowthStage());
        assertFalse(createdTree.isDamaged());
        assertTrue(createdTree.isCompleted());
    }

    @Test
    void interruptSessionPersistsInterruptedStateAndBlocksCompletion() throws Exception {
        User savedUser = userRepository.save(User.builder()
                .email("focus-interrupt@example.com")
                .passwordHash("hashed-password")
                .displayName("Focus Interrupt")
                .routines(new HashSet<>())
                .focusSessions(new HashSet<>())
                .build());

        Routine savedRoutine = routineRepository.save(Routine.builder()
                .user(savedUser)
                .title("Deep work")
                .description("Morning block")
                .completed(false)
                .build());

        Task savedTask = taskRepository.save(Task.builder()
                .routine(savedRoutine)
                .title("Review notes")
                .description("Prepare summary")
                .category(TaskCategory.HEALTH)
                .completed(false)
                .build());

        mockMvc.perform(post("/api/focus-sessions/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": %d,
                                  "taskId": %d
                                }
                                """.formatted(savedUser.getId(), savedTask.getId())))
                .andExpect(status().isCreated());

        FocusSession startedSession = focusSessionRepository.findAll().getFirst();
        startedSession.setStartedAt(startedSession.getStartedAt().minus(Duration.ofMinutes(120)));
        focusSessionRepository.save(startedSession);

        mockMvc.perform(post("/api/focus-sessions/{id}/interrupt", startedSession.getId()))
                .andExpect(status().isOk());

        FocusSession interruptedSession = focusSessionRepository.findById(startedSession.getId()).orElseThrow();
        assertTrue(interruptedSession.isInterrupted());
        assertFalse(interruptedSession.isCompleted());
        assertNotNull(interruptedSession.getEndedAt());
        assertNotNull(interruptedSession.getDuration());

        Tree damagedTree = treeRepository.findByFocusSessionId(interruptedSession.getId()).orElseThrow();
        assertEquals(TreeType.PINE, damagedTree.getTreeType());
        assertTrue(damagedTree.isDamaged());
        assertFalse(damagedTree.isCompleted());
        assertEquals(74, damagedTree.getGrowthProgress());
        assertEquals(2, damagedTree.getGrowthStage());

        mockMvc.perform(post("/api/focus-sessions/{id}/complete", startedSession.getId()))
                .andExpect(status().isConflict());
    }

    @Test
    void deleteSessionCancelsItAndRemovesItFromDatabase() throws Exception {
        User savedUser = userRepository.save(User.builder()
                .email("focus-cancel@example.com")
                .passwordHash("hashed-password")
                .displayName("Focus Cancel")
                .routines(new HashSet<>())
                .focusSessions(new HashSet<>())
                .build());

        Routine savedRoutine = routineRepository.save(Routine.builder()
                .user(savedUser)
                .title("Cancel flow")
                .description("Check cancellation")
                .completed(false)
                .build());

        Task savedTask = taskRepository.save(Task.builder()
                .routine(savedRoutine)
                .title("Cancel task")
                .description("Stop and remove")
                .category(TaskCategory.GENERAL)
                .completed(false)
                .build());

        mockMvc.perform(post("/api/focus-sessions/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": %d,
                                  "taskId": %d
                                }
                                """.formatted(savedUser.getId(), savedTask.getId())))
                .andExpect(status().isCreated());

        FocusSession startedSession = focusSessionRepository.findAll().getFirst();

        mockMvc.perform(delete("/api/focus-sessions/{id}", startedSession.getId()))
                .andExpect(status().isNoContent());

        assertTrue(focusSessionRepository.findById(startedSession.getId()).isEmpty());
        assertTrue(treeRepository.findByFocusSessionId(startedSession.getId()).isEmpty());
    }
}
