package com.lifeforest.backend.tree.service;

import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.focussession.exception.FocusSessionNotFoundException;
import com.lifeforest.backend.focussession.repository.FocusSessionRepository;
import com.lifeforest.backend.task.domain.Task;
import com.lifeforest.backend.task.domain.TaskCategory;
import com.lifeforest.backend.tree.domain.Tree;
import com.lifeforest.backend.tree.domain.TreeType;
import com.lifeforest.backend.tree.exception.TreeNotFoundException;
import com.lifeforest.backend.tree.repository.TreeRepository;
import com.lifeforest.backend.user.domain.User;
import com.lifeforest.backend.user.exception.UserNotFoundException;
import com.lifeforest.backend.user.repository.UserRepository;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TreeService {

    private static final String TREE = "tree";
    private static final String DEFAULT_SPECIES = "Oak";
    private static final int MAX_GROWTH_PROGRESS = 100;
    private static final int PLANT_STAGE_THRESHOLD = 25;
    private static final int HALF_GROWN_STAGE_THRESHOLD = 50;
    private static final int FULL_GROWN_STAGE_THRESHOLD = 75;
    private static final int MAX_GROWTH_STAGE = 3;
    private static final int MAX_DAMAGED_GROWTH_PROGRESS = FULL_GROWN_STAGE_THRESHOLD - 1;

    private final TreeRepository treeRepository;
    private final UserRepository userRepository;
    private final FocusSessionRepository focusSessionRepository;

    @Transactional
    public Tree create(Tree tree) {
        Tree treeToSave = prepareTree(tree);
        return treeRepository.save(Objects.requireNonNull(treeToSave, TREE));
    }

    public TreeType determineTreeType(Task task) {
        TaskCategory category = task == null || task.getCategory() == null
                ? TaskCategory.GENERAL
                : task.getCategory();

        return switch (category) {
            case WORK -> TreeType.OAK;
            case STUDY -> TreeType.BIRCH;
            case HEALTH -> TreeType.PINE;
            case CREATIVE -> TreeType.CHERRY_BLOSSOM;
            case GENERAL -> TreeType.MAPLE;
        };
    }

    @Transactional
    public Tree createForCompletedSession(FocusSession focusSession) {
        FocusSession completedSession = loadFocusSession(
                Objects.requireNonNull(focusSession, "focusSession").getId()
        );

        if (!completedSession.isCompleted()) {
            throw new IllegalArgumentException("Tree can only be created for completed focus sessions.");
        }

        if (completedSession.isInterrupted()) {
            throw new IllegalArgumentException("Interrupted focus sessions cannot grow a tree.");
        }

        return treeRepository.findByFocusSessionId(completedSession.getId())
                .orElseGet(() -> saveTreeForCompletedSession(completedSession));
    }

    @Transactional
    public Tree createForInterruptedSession(FocusSession focusSession) {
        FocusSession interruptedSession = loadFocusSession(
                Objects.requireNonNull(focusSession, "focusSession").getId()
        );

        if (!interruptedSession.isInterrupted()) {
            throw new IllegalArgumentException("Tree can only be damaged for interrupted focus sessions.");
        }

        return treeRepository.findByFocusSessionId(interruptedSession.getId())
                .map(existingTree -> markTreeAsDamaged(existingTree, interruptedSession.getDuration()))
                .orElseGet(() -> saveTreeForInterruptedSession(interruptedSession));
    }

    @Transactional(readOnly = true)
    public List<Tree> getAll() {
        return treeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Tree> getAllByUser(Long userId) {
        loadUser(userId);
        return treeRepository.findAllByUserId(userId);
    }

    @Transactional(readOnly = true)
    public Tree getById(Long treeId) {
        return loadTree(treeId);
    }

    @Transactional(readOnly = true)
    public Tree getByFocusSession(Long focusSessionId) {
        loadFocusSession(focusSessionId);
        return treeRepository.findByFocusSessionId(focusSessionId)
                .orElseThrow(() -> new TreeNotFoundException(focusSessionId));
    }

    @Transactional
    public Tree update(Long treeId, Tree tree) {
        Tree existingTree = loadTree(treeId);
        User user = resolveUser(tree);
        FocusSession focusSession = resolveFocusSession(tree);

        existingTree.setUser(user);
        existingTree.setFocusSession(focusSession);
        existingTree.setSpecies(tree.getSpecies());
        existingTree.setTreeType(tree.getTreeType());
        existingTree.setGrowthStage(tree.getGrowthStage());
        existingTree.setGrowthProgress(tree.getGrowthProgress());
        existingTree.setDamaged(tree.isDamaged());
        existingTree.setCompleted(tree.isCompleted());

        validateFocusSessionOwnership(user, focusSession);

        return treeRepository.save(existingTree);
    }

    @Transactional
    public void delete(Long treeId) {
        Tree tree = loadTree(treeId);
        treeRepository.delete(Objects.requireNonNull(tree, TREE));
    }

    private Tree prepareTree(Tree tree) {
        Tree treeToPrepare = Objects.requireNonNull(tree, TREE);
        User user = resolveUser(treeToPrepare);
        FocusSession focusSession = resolveFocusSession(treeToPrepare);

        treeToPrepare.setUser(user);
        treeToPrepare.setFocusSession(focusSession);
        validateFocusSessionOwnership(user, focusSession);

        return treeToPrepare;
    }

    private Tree saveTreeForCompletedSession(FocusSession focusSession) {
        int growthProgress = calculateGrowthProgress(focusSession.getDuration());
        int growthStage = calculateGrowthStage(growthProgress);

        Tree tree = Tree.builder()
                .user(focusSession.getUser())
                .focusSession(focusSession)
                .species(DEFAULT_SPECIES)
                .treeType(resolveTreeType(focusSession))
                .growthStage(growthStage)
                .growthProgress(growthProgress)
                .damaged(false)
                .completed(growthProgress >= MAX_GROWTH_PROGRESS)
                .build();

        Tree savedTree = treeRepository.save(tree);
        focusSession.setTree(savedTree);
        return savedTree;
    }

    private Tree saveTreeForInterruptedSession(FocusSession focusSession) {
        int growthProgress = calculateDamagedGrowthProgress(focusSession.getDuration());
        int growthStage = calculateGrowthStage(growthProgress);

        Tree tree = Tree.builder()
                .user(focusSession.getUser())
                .focusSession(focusSession)
                .species(DEFAULT_SPECIES)
                .treeType(resolveTreeType(focusSession))
                .growthStage(growthStage)
                .growthProgress(growthProgress)
                .damaged(true)
                .completed(false)
                .build();

        Tree savedTree = treeRepository.save(tree);
        focusSession.setTree(savedTree);
        return savedTree;
    }

    private Tree markTreeAsDamaged(Tree existingTree, Integer durationMinutes) {
        int growthProgress = calculateDamagedGrowthProgress(durationMinutes);
        int growthStage = calculateGrowthStage(growthProgress);

        existingTree.setGrowthProgress(growthProgress);
        existingTree.setGrowthStage(growthStage);
        existingTree.setDamaged(true);
        existingTree.setCompleted(false);
        existingTree.setTreeType(resolveTreeType(existingTree.getFocusSession()));

        return treeRepository.save(existingTree);
    }

    private Tree loadTree(Long treeId) {
        return treeRepository.findById(Objects.requireNonNull(treeId, "treeId"))
                .orElseThrow(() -> new TreeNotFoundException(treeId));
    }

    private User resolveUser(Tree tree) {
        Long userId = Objects.requireNonNull(
                Objects.requireNonNull(tree.getUser(), "tree.user").getId(),
                "tree.user.id"
        );

        return loadUser(userId);
    }

    private FocusSession resolveFocusSession(Tree tree) {
        if (tree.getFocusSession() == null || tree.getFocusSession().getId() == null) {
            return null;
        }

        return loadFocusSession(tree.getFocusSession().getId());
    }

    private User loadUser(Long userId) {
        return userRepository.findById(Objects.requireNonNull(userId, "userId"))
                .orElseThrow(() -> new UserNotFoundException(userId));
    }

    private FocusSession loadFocusSession(Long focusSessionId) {
        return focusSessionRepository.findById(Objects.requireNonNull(focusSessionId, "focusSessionId"))
                .orElseThrow(() -> new FocusSessionNotFoundException(focusSessionId));
    }

    private void validateFocusSessionOwnership(User user, FocusSession focusSession) {
        if (focusSession == null) {
            return;
        }

        Long sessionOwnerId = focusSession.getUser().getId();
        if (!sessionOwnerId.equals(user.getId())) {
            throw new IllegalArgumentException("Focus session does not belong to the selected user.");
        }
    }

    private int calculateGrowthProgress(Integer durationMinutes) {
        int safeDuration = Math.max(0, durationMinutes == null ? 0 : durationMinutes);
        return Math.min(MAX_GROWTH_PROGRESS, safeDuration);
    }

    private int calculateDamagedGrowthProgress(Integer durationMinutes) {
        int safeDuration = Math.max(0, durationMinutes == null ? 0 : durationMinutes);
        return Math.min(MAX_DAMAGED_GROWTH_PROGRESS, safeDuration);
    }

    private TreeType resolveTreeType(FocusSession focusSession) {
        if (focusSession.getTreeType() != null) {
            return focusSession.getTreeType();
        }

        return determineTreeType(focusSession.getTask());
    }

    private int calculateGrowthStage(int growthProgress) {
        int safeProgress = Math.max(0, growthProgress);

        if (safeProgress >= FULL_GROWN_STAGE_THRESHOLD) {
            return MAX_GROWTH_STAGE;
        }

        if (safeProgress >= HALF_GROWN_STAGE_THRESHOLD) {
            return 2;
        }

        if (safeProgress >= PLANT_STAGE_THRESHOLD) {
            return 1;
        }

        return 0;
    }
}
