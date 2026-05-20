package com.lifeforest.backend.task.repository;

import com.lifeforest.backend.task.domain.Task;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findAllByRoutineId(Long routineId);

    void deleteAllByRoutineId(Long routineId);
}
