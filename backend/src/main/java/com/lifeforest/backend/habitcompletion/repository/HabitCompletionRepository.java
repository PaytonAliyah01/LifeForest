package com.lifeforest.backend.habitcompletion.repository;

import com.lifeforest.backend.habitcompletion.domain.HabitCompletion;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HabitCompletionRepository extends JpaRepository<HabitCompletion, Long> {
    List<HabitCompletion> findAllByTaskIdOrderByCompletedOnDesc(Long taskId);

    List<HabitCompletion> findAllByTaskId(Long taskId);

    Optional<HabitCompletion> findByTaskIdAndCompletedOn(Long taskId, LocalDate completedOn);

    void deleteByTaskIdAndCompletedOn(Long taskId, LocalDate completedOn);
}
