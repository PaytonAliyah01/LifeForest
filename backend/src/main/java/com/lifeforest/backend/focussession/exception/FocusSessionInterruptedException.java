package com.lifeforest.backend.focussession.exception;

public class FocusSessionInterruptedException extends RuntimeException {
    public FocusSessionInterruptedException(Long id) {
        super("Focus session is interrupted and cannot be completed: " + id);
    }
}
