package com.lifeforest.backend.focussession.exception;

public class FocusSessionNotFoundException extends RuntimeException {
    public FocusSessionNotFoundException(Long id) {
        super("Focus session not found with ID: " + id);
    }
}
