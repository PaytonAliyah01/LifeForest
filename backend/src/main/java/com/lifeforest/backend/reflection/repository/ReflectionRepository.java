package com.lifeforest.backend.reflection.repository;

import com.lifeforest.backend.reflection.domain.Reflection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReflectionRepository extends JpaRepository<Reflection, Long> {
    List<Reflection> findAllByUserId(Long userId);

    Optional<Reflection> findByFocusSessionId(Long focusSessionId);
}
