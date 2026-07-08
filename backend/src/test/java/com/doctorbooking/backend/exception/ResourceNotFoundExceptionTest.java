package com.doctorbooking.backend.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ResourceNotFoundExceptionTest {

    @Test
    void constructor() {

        ResourceNotFoundException ex =
                new ResourceNotFoundException("Resource not found");

        assertEquals("Resource not found", ex.getMessage());
        assertNull(ex.getCause());
    }
}