package com.lifeforest.backend.achievement.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.focussession.repository.FocusSessionRepository;
import com.lifeforest.backend.reflection.domain.Reflection;
import com.lifeforest.backend.reflection.repository.ReflectionRepository;
import com.lifeforest.backend.routine.domain.Routine;
import com.lifeforest.backend.routine.repository.RoutineRepository;
import com.lifeforest.backend.tree.domain.Tree;
import com.lifeforest.backend.tree.domain.TreeType;
import com.lifeforest.backend.tree.repository.TreeRepository;
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
class AchievementsControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoutineRepository routineRepository;

    @Autowired
    private FocusSessionRepository focusSessionRepository;

    @Autowired
    private ReflectionRepository reflectionRepository;

    @Autowired
    private TreeRepository treeRepository;

    @BeforeEach
    void clearData() {
        reflectionRepository.deleteAll();
        treeRepository.deleteAll();
        focusSessionRepository.deleteAll();
        routineRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void getAchievementsReturnsDerivedMilestonesForUser() throws Exception {
        User user = userRepository.save(User.builder()
                .email("achievements@example.com")
                .passwordHash("hashed-password")
                .displayName("Achievement User")
                .routines(new HashSet<>())
                .focusSessions(new HashSet<>())
                .trees(new HashSet<>())
                .reflections(new HashSet<>())
                .build());

        routineRepository.save(Routine.builder()
                .user(user)
                .title("Morning")
                .description("Start the day")
                .completed(false)
                .build());

        FocusSession completedSession = focusSessionRepository.save(FocusSession.builder()
                .user(user)
                .startedAt(java.time.Instant.parse("2026-06-02T09:00:00Z"))
                .endedAt(java.time.Instant.parse("2026-06-02T09:45:00Z"))
                .duration(45)
                .completed(true)
                .interrupted(false)
                .build());

        reflectionRepository.save(Reflection.builder()
                .user(user)
                .focusSession(completedSession)
                .content("Good session")
                .focusLevel(4)
                .build());

        treeRepository.save(Tree.builder()
                .user(user)
                .focusSession(completedSession)
                .species("Oak")
                .treeType(TreeType.OAK)
                .growthStage(0)
                .growthProgress(45)
                .damaged(false)
                .completed(false)
                .build());

        mockMvc.perform(get("/api/achievements").param("userId", String.valueOf(user.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(user.getId()))
                .andExpect(jsonPath("$.unlockedCount").value(4))
                .andExpect(jsonPath("$.totalCount").value(14))
                .andExpect(jsonPath("$.achievements[0].code").value("FIRST_ROUTINE"))
                .andExpect(jsonPath("$.achievements[0].category").value("ROUTINES"))
                .andExpect(jsonPath("$.achievements[0].unlocked").value(true))
                .andExpect(jsonPath("$.achievements[5].code").value("FIRST_TREE"))
                .andExpect(jsonPath("$.achievements[5].unlocked").value(true))
                .andExpect(jsonPath("$.achievements[11].code").value("THREE_HUNDRED_MINUTES"))
                .andExpect(jsonPath("$.achievements[11].progressPercentage").value(15));
    }
}
