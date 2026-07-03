package com.doctorbooking.backend.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AIServiceExceptionTest {

    @Test
    void constructor_message() {

        AIServiceException ex =
                new AIServiceException("AI Error");

        assertEquals("AI Error", ex.getMessage());
        assertNull(ex.getCause());
    }

    @Test
    void constructor_message_and_cause() {

        RuntimeException cause =
                new RuntimeException("Root Cause");

        AIServiceException ex =
                new AIServiceException("AI Error", cause);

        assertEquals("AI Error", ex.getMessage());
        assertEquals(cause, ex.getCause());
    }
}