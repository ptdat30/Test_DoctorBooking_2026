package com.doctorbooking.backend.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class BadRequestExceptionTest {

    @Test
    void constructor() {

        BadRequestException ex =
                new BadRequestException("Bad Request");

        assertEquals("Bad Request", ex.getMessage());
        assertNull(ex.getCause());
    }
}
