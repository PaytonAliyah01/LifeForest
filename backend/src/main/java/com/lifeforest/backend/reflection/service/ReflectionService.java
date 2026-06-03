package com.lifeforest.backend.reflection.service;

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

    @Transactional
    public Reflection create(Reflection reflection) {
        Reflection reflectionToSave = prepareReflection(reflection);
        return reflectionRepository.save(Objects.requireNonNull(reflectionToSave, REFLECTION));
    }

    @Transactional
    public Reflection create(Long userId, ReflectionCreateRequestDto dto) {
        User user = loadUser(Objects.requireNonNull(userId, "userId"));
        FocusSession focusSession = loadFocusSession(dto.focusSessionId());
        validateFocusSessionOwnership(user, focusSession);

        Reflection reflection = reflectionMapper.toEntity(user, focusSession, dto);
        return reflectionRepository.save(Objects.requireNonNull(reflection, REFLECTION));
    }

    @Transactional(readOnly = true)
    public List<Reflection> getAll() {
        return reflectionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Reflection> getAllByUser(Long userId) {
        loadUser(userId);
        return reflectionRepository.findAllByUserId(userId);
    }

    @Transactional(readOnly = true)
    public Reflection getById(Long reflectionId) {
        return loadReflection(reflectionId);
    }

    @Transactional(readOnly = true)
    public Reflection getByFocusSession(Long focusSessionId) {
        loadFocusSession(focusSessionId);
        return reflectionRepository.findByFocusSessionId(focusSessionId)
                .orElseThrow(() -> new ReflectionNotFoundException(focusSessionId));
    }

    @Transactional
    public Reflection update(Long reflectionId, Reflection reflection) {
        Reflection existingReflection = loadReflection(reflectionId);
        User user = resolveUser(reflection);
        FocusSession focusSession = resolveFocusSession(reflection);

        existingReflection.setUser(user);
        existingReflection.setFocusSession(focusSession);
        existingReflection.setContent(reflection.getContent());
        existingReflection.setFocusLevel(reflection.getFocusLevel());
        existingReflection.setDistractions(reflection.getDistractions());

        validateFocusSessionOwnership(user, focusSession);

        return reflectionRepository.save(existingReflection);
    }

    @Transactional
    public void delete(Long reflectionId) {
        Reflection reflection = loadReflection(reflectionId);
        reflectionRepository.delete(Objects.requireNonNull(reflection, REFLECTION));
    }

    private Reflection prepareReflection(Reflection reflection) {
        Reflection reflectionToPrepare = Objects.requireNonNull(reflection, REFLECTION);
        User user = resolveUser(reflectionToPrepare);
        FocusSession focusSession = resolveFocusSession(reflectionToPrepare);

        reflectionToPrepare.setUser(user);
        reflectionToPrepare.setFocusSession(focusSession);
        validateFocusSessionOwnership(user, focusSession);

        return reflectionToPrepare;
    }

    private Reflection loadReflection(Long reflectionId) {
        return reflectionRepository.findById(Objects.requireNonNull(reflectionId, "reflectionId"))
                .orElseThrow(() -> new ReflectionNotFoundException(reflectionId));
    }

    private User resolveUser(Reflection reflection) {
        Long userId = Objects.requireNonNull(
                Objects.requireNonNull(reflection.getUser(), "reflection.user").getId(),
                "reflection.user.id"
        );

        return loadUser(userId);
    }

    private FocusSession resolveFocusSession(Reflection reflection) {
        if (reflection.getFocusSession() == null || reflection.getFocusSession().getId() == null) {
            return null;
        }

        return loadFocusSession(reflection.getFocusSession().getId());
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
