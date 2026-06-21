package com.lifeforest.backend.common.security;

import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.reflection.domain.Reflection;
import com.lifeforest.backend.routine.domain.Routine;
import com.lifeforest.backend.task.domain.Task;
import com.lifeforest.backend.tree.domain.Tree;
import com.lifeforest.backend.user.domain.User;
import com.lifeforest.backend.user.repository.UserRepository;
import java.util.Objects;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticatedUserService {

    private final UserRepository userRepository;

    public AuthenticatedUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new AccessDeniedException("Authentication is required.");
        }

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Authenticated user could not be resolved."));
    }

    public void assertCanAccessUserId(Long userId) {
        if (!getCurrentUser().getId().equals(Objects.requireNonNull(userId, "userId"))) {
            throw new AccessDeniedException("You cannot access another user's data.");
        }
    }

    public void assertCanAccessUser(User user) {
        if (!getCurrentUser().getId().equals(Objects.requireNonNull(user, "user").getId())) {
            throw new AccessDeniedException("You cannot access another user's data.");
        }
    }

    public void assertCanAccessRoutine(Routine routine) {
        assertCanAccessUser(Objects.requireNonNull(routine, "routine").getUser());
    }

    public void assertCanAccessTask(Task task) {
        assertCanAccessRoutine(Objects.requireNonNull(task, "task").getRoutine());
    }

    public void assertCanAccessFocusSession(FocusSession focusSession) {
        assertCanAccessUser(Objects.requireNonNull(focusSession, "focusSession").getUser());
    }

    public void assertCanAccessReflection(Reflection reflection) {
        assertCanAccessUser(Objects.requireNonNull(reflection, "reflection").getUser());
    }

    public void assertCanAccessTree(Tree tree) {
        assertCanAccessUser(Objects.requireNonNull(tree, "tree").getUser());
    }
}
