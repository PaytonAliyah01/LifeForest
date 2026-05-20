package com.lifeforest.backend.tree.exception;

public class TreeNotFoundException extends RuntimeException {
    public TreeNotFoundException(Long id) {
        super("Tree not found with ID: " + id);
    }
}
