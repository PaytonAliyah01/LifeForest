package com.lifeforest.backend.analytics.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.focussession.repository.FocusSessionRepository;
import com.lifeforest.backend.reflection.domain.Reflection;
import com.lifeforest.backend.reflection.repository.ReflectionRepository;
import com.lifeforest.backend.routine.domain.Routine;
import com.lifeforest.backend.routine.repository.RoutineRepository;
import com.lifeforest.backend.task.domain.Task;
import com.lifeforest.backend.task.domain.TaskCategory;
import com.lifeforest.backend.task.domain.TaskType;
import com.lifeforest.backend.task.repository.TaskRepository;
import com.lifeforest.backend.tree.domain.Tree;
import com.lifeforest.backend.tree.domain.TreeType;
import com.lifeforest.backend.tree.repository.TreeRepository;
import com.lifeforest.backend.user.domain.User;
import com.lifeforest.backend.user.repository.UserRepository;
import java.time.Instant;
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
class AnalyticsControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FocusSessionRepository focusSessionRepository;

    @Autowired
    private ReflectionRepository reflectionRepository;

    @Autowired
    private TreeRepository treeRepository;

    @Autowired
    private RoutineRepository routineRepository;

    @Autowired
    private TaskRepository taskRepository;

    @BeforeEach
    void clearData() {
        reflectionRepository.deleteAll();
        treeRepository.deleteAll();
        focusSessionRepository.deleteAll();
        taskRepository.deleteAll();
        routineRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void getAnalyticsReturnsProductivityMetricsForUser() throws Exception {
        User user = userRepository.save(User.builder()
                .email("analytics@example.com")
                .passwordHash("hashed-password")
                .displayName("Analytics User")
                .routines(new HashSet<>())
                .focusSessions(new HashSet<>())
                .trees(new HashSet<>())
                .reflections(new HashSet<>())
                .build());

        Routine routine = routineRepository.save(Routine.builder()
                .user(user)
                .title("Analytics routine")
                .description("Track duration accuracy")
                .completed(false)
                .build());

        Task completedTask = taskRepository.save(Task.builder()
                .routine(routine)
                .title("Focused task")
                .description("Estimated for analytics")
                .duration(25)
                .category(TaskCategory.GENERAL)
                .taskType(TaskType.ONE_TIME)
                .completed(false)
                .build());

        FocusSession completedSession = focusSessionRepository.save(FocusSession.builder()
                .user(user)
                .task(completedTask)
                .treeType(TreeType.OAK)
                .startedAt(Instant.parse("2026-06-01T10:00:00Z"))
                .endedAt(Instant.parse("2026-06-01T10:30:00Z"))
                .duration(30)
                .completed(true)
                .interrupted(false)
                .build());

        FocusSession interruptedSession = focusSessionRepository.save(FocusSession.builder()
                .user(user)
                .treeType(TreeType.PINE)
                .startedAt(Instant.parse("2026-06-01T11:00:00Z"))
                .endedAt(Instant.parse("2026-06-01T11:15:00Z"))
                .duration(15)
                .completed(false)
                .interrupted(true)
                .build());

        reflectionRepository.save(Reflection.builder()
                .user(user)
                .focusSession(completedSession)
                .content("Solid session")
                .focusLevel(4)
                .distractions("Messages")
                .build());

        treeRepository.save(Tree.builder()
                .user(user)
                .focusSession(completedSession)
                .species("Oak")
                .treeType(TreeType.OAK)
                .growthStage(1)
                .growthProgress(30)
                .damaged(false)
                .completed(false)
                .build());

        treeRepository.save(Tree.builder()
                .user(user)
                .focusSession(interruptedSession)
                .species("Pine")
                .treeType(TreeType.PINE)
                .growthStage(0)
                .growthProgress(10)
                .damaged(true)
                .completed(false)
                .build());

        mockMvc.perform(get("/api/analytics").param("userId", String.valueOf(user.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(user.getId()))
                .andExpect(jsonPath("$.totalSessions").value(2))
                .andExpect(jsonPath("$.completedSessions").value(1))
                .andExpect(jsonPath("$.interruptedSessions").value(1))
                .andExpect(jsonPath("$.completionRate").value(50.0))
                .andExpect(jsonPath("$.totalFocusMinutes").value(45))
                .andExpect(jsonPath("$.completedFocusMinutes").value(30))
                .andExpect(jsonPath("$.weeklyFocusMinutes").value(30))
                .andExpect(jsonPath("$.estimatedTaskMinutes").value(25))
                .andExpect(jsonPath("$.actualTaskMinutes").value(30))
                .andExpect(jsonPath("$.estimationAccuracyPercentage").value(80.0))
                .andExpect(jsonPath("$.averageSessionMinutes").value(22.5))
                .andExpect(jsonPath("$.averageFocusLevel").value(4.0))
                .andExpect(jsonPath("$.reflectionsCount").value(1))
                .andExpect(jsonPath("$.treesGrown").value(2))
                .andExpect(jsonPath("$.damagedTrees").value(1));
    }
}
