package com.lifeforest.backend.task.domain;

import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.routine.domain.Routine;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "routine_id", nullable = false)
    private Routine routine;

    @Builder.Default
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<FocusSession> focusSessions = new HashSet<>();

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 500)
    private String description;

    @Column
    private Integer duration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TaskCategory category;

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
        if (this.category == null) {
            this.category = TaskCategory.GENERAL;
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
