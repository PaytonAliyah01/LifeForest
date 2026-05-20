package com.lifeforest.backend.routine.exception;

public class RoutineNotFoundException extends RuntimeException {
    public RoutineNotFoundException(Long id) {
        super("Routine not found with ID: " + id);
    }
}