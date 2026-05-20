package com.lifeforest.backend.tree.repository;

import com.lifeforest.backend.tree.domain.Tree;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TreeRepository extends JpaRepository<Tree, Long> {
    List<Tree> findAllByUserId(Long userId);

    Optional<Tree> findByFocusSessionId(Long focusSessionId);
}
