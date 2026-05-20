package com.lifeforest.backend.routine.repository;

import com.lifeforest.backend.routine.domain.Routine;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoutineRepository extends JpaRepository<Routine, Long> {
    List<Routine> findAllByUserId(Long userId);
}
