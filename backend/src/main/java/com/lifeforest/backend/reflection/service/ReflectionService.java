package com.lifeforest.backend.reflection.service;

import com.lifeforest.backend.common.security.AuthenticatedUserService;
import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.focussession.exception.FocusSessionNotFoundException;
import com.lifeforest.backend.focussession.repository.FocusSessionRepository;
import com.lifeforest.backend.reflection.domain.Reflection;
import com.lifeforest.backend.reflection.dto.request.ReflectionCreateRequestDto;
import com.lifeforest.backend.reflection.exception.ReflectionNotFoundException;
import com.lifeforest.backend.reflection.mapper.ReflectionMapper;
import com.lifeforest.backend.reflection.repository.ReflectionRepository;
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
public class ReflectionService {

    private static final String REFLECTION = "reflection";

    private final ReflectionRepository reflectionRepository;
    private final UserRepository userRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final ReflectionMapper reflectionMapper;
    private final AuthenticatedUserService authenticatedUserService;

    @Transactional
    public Reflection create(Long userId, ReflectionCreateRequestDto dto) {
        authenticatedUserService.assertCanAccessUserId(userId);
        User user = loadUser(Objects.requireNonNull(userId, "userId"));
        FocusSession focusSession = loadFocusSession(dto.focusSessionId());
        validateFocusSessionOwnership(user, focusSession);

        Reflection reflection = reflectionMapper.toEntity(user, focusSession, dto);
        return reflectionRepository.save(Objects.requireNonNull(reflection, REFLECTION));
    }

    @Transactional(readOnly = true)
    public List<Reflection> getAll() {
        return getAllByUser(authenticatedUserService.getCurrentUser().getId());
    }

    @Transactional(readOnly = true)
    public List<Reflection> getAllByUser(Long userId) {
        authenticatedUserService.assertCanAccessUserId(userId);
        loadUser(userId);
        return reflectionRepository.findAllByUserId(userId);
    }

    @Transactional(readOnly = true)
    public Reflection getById(Long reflectionId) {
        Reflection reflection = loadReflection(reflectionId);
        authenticatedUserService.assertCanAccessReflection(reflection);
        return reflection;
    }

    @Transactional(readOnly = true)
    public Reflection getByFocusSession(Long focusSessionId) {
        loadFocusSession(focusSessionId);
        Reflection reflection = reflectionRepository.findByFocusSessionId(focusSessionId)
                .orElseThrow(() -> new ReflectionNotFoundException(focusSessionId));
        authenticatedUserService.assertCanAccessReflection(reflection);
        return reflection;
    }

    @Transactional
    public void delete(Long reflectionId) {
        Reflection reflection = loadReflection(reflectionId);
        authenticatedUserService.assertCanAccessReflection(reflection);
        reflectionRepository.delete(Objects.requireNonNull(reflection, REFLECTION));
    }

    private Reflection loadReflection(Long reflectionId) {
        return reflectionRepository.findById(Objects.requireNonNull(reflectionId, "reflectionId"))
                .orElseThrow(() -> new ReflectionNotFoundException(reflectionId));
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
}
