package com.lifeforest.backend.tree.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.focussession.repository.FocusSessionRepository;
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
class TreeControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TreeRepository treeRepository;

    @Autowired
    private FocusSessionRepository focusSessionRepository;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void clearData() {
        treeRepository.deleteAll();
        focusSessionRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void getTreesByUserReturnsOnlyThatUsersForest() throws Exception {
        User firstUser = userRepository.save(User.builder()
                .email("forest-one@example.com")
                .passwordHash("hashed-password")
                .displayName("Forest One")
                .focusSessions(new HashSet<>())
                .routines(new HashSet<>())
                .trees(new HashSet<>())
                .build());

        User secondUser = userRepository.save(User.builder()
                .email("forest-two@example.com")
                .passwordHash("hashed-password")
                .displayName("Forest Two")
                .focusSessions(new HashSet<>())
                .routines(new HashSet<>())
                .trees(new HashSet<>())
                .build());

        FocusSession firstSession = focusSessionRepository.save(FocusSession.builder()
                .user(firstUser)
                .treeType(TreeType.OAK)
                .startedAt(Instant.parse("2026-05-20T08:00:00Z"))
                .endedAt(Instant.parse("2026-05-20T08:45:00Z"))
                .duration(45)
                .completed(true)
                .interrupted(false)
                .build());

        FocusSession secondSession = focusSessionRepository.save(FocusSession.builder()
                .user(secondUser)
                .treeType(TreeType.PINE)
                .startedAt(Instant.parse("2026-05-20T09:00:00Z"))
                .endedAt(Instant.parse("2026-05-20T09:30:00Z"))
                .duration(30)
                .completed(true)
                .interrupted(false)
                .build());

        treeRepository.save(Tree.builder()
                .user(firstUser)
                .focusSession(firstSession)
                .species("Oak")
                .treeType(TreeType.OAK)
                .growthStage(1)
                .growthProgress(45)
                .damaged(false)
                .completed(false)
                .build());

        treeRepository.save(Tree.builder()
                .user(secondUser)
                .focusSession(secondSession)
                .species("Pine")
                .treeType(TreeType.PINE)
                .growthStage(1)
                .growthProgress(30)
                .damaged(false)
                .completed(false)
                .build());

        mockMvc.perform(get("/api/trees").param("userId", String.valueOf(firstUser.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].userId").value(firstUser.getId()))
                .andExpect(jsonPath("$[0].treeType").value("OAK"))
                .andExpect(jsonPath("$[0].growthProgress").value(45));
    }

    @Test
    void getTreeByIdReturnsTreeDetails() throws Exception {
        User user = userRepository.save(User.builder()
                .email("forest-detail@example.com")
                .passwordHash("hashed-password")
                .displayName("Forest Detail")
                .focusSessions(new HashSet<>())
                .routines(new HashSet<>())
                .trees(new HashSet<>())
                .build());

        FocusSession focusSession = focusSessionRepository.save(FocusSession.builder()
                .user(user)
                .treeType(TreeType.CHERRY_BLOSSOM)
                .startedAt(Instant.parse("2026-05-20T10:00:00Z"))
                .endedAt(Instant.parse("2026-05-20T10:50:00Z"))
                .duration(50)
                .completed(true)
                .interrupted(false)
                .build());

        Tree tree = treeRepository.save(Tree.builder()
                .user(user)
                .focusSession(focusSession)
                .species("Oak")
                .treeType(TreeType.CHERRY_BLOSSOM)
                .growthStage(2)
                .growthProgress(50)
                .damaged(false)
                .completed(false)
                .build());

        mockMvc.perform(get("/api/trees/{treeId}", tree.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(tree.getId()))
                .andExpect(jsonPath("$.focusSessionId").value(focusSession.getId()))
                .andExpect(jsonPath("$.treeType").value("CHERRY_BLOSSOM"))
                .andExpect(jsonPath("$.growthStage").value(2));
    }
}
