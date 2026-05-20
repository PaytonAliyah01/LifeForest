package com.lifeforest.backend.routine.domain;

import com.lifeforest.backend.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import com.lifeforest.backend.task.domain.Task;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "routines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Routine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Builder.Default
    @OneToMany(mappedBy = "routine", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Task> tasks = new HashSet<>();

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 500)
    private String description;

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

    public void addTask(Task task) {
        if (task == null) {
            return;
        }

        tasks.add(task);
        task.setRoutine(this);
    }

    public void removeTask(Task task) {
        if (task == null) {
            return;
        }

        tasks.remove(task);
        task.setRoutine(null);
    }
}
