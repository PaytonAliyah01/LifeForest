package com.lifeforest.backend.tree.domain;

import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "trees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tree {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "focus_session_id", unique = true)
    private FocusSession focusSession;

    @Column(nullable = false, length = 100)
    private String species;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TreeType treeType;

    @Column(nullable = false)
    private int growthStage;

    @Column(nullable = false)
    private int growthProgress;

    @Column(nullable = false)
    private boolean damaged;

    @Column(nullable = false)
    private boolean completed;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
