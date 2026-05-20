package com.lifeforest.backend.focussession.repository;

import com.lifeforest.backend.focussession.domain.FocusSession;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FocusSessionRepository extends JpaRepository<FocusSession, Long> {
    List<FocusSession> findAllByUserId(Long userId);

    List<FocusSession> findAllByTaskId(Long taskId);
}
