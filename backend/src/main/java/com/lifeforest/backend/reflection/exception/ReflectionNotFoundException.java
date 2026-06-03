package com.lifeforest.backend.reflection.exception;

public class ReflectionNotFoundException extends RuntimeException {

    public ReflectionNotFoundException(Long reflectionId) {
        super("Reflection not found with id: " + reflectionId);
    }
}
