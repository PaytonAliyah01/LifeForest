package com.lifeforest.backend.website.controller;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

class DownloadPageControllerUnitTest {

    private DownloadPageController controller;

    @BeforeEach
    void setUp() {
        controller = new DownloadPageController();
        ReflectionTestUtils.setField(controller, "pageTitle", "LifeForest");
        ReflectionTestUtils.setField(controller, "pageDescription",
                "Build routines, stay focused, reflect with intention, and turn steady progress into visible growth.");
        ReflectionTestUtils.setField(controller, "apkDownloadUrl", "");
        ReflectionTestUtils.setField(controller, "contactEmail", "hello@lifeforest.app");
        ReflectionTestUtils.setField(controller, "developerName", "Payton");
        ReflectionTestUtils.setField(controller, "developerBio",
                "Payton is building LifeForest as a habit tracker that turns consistency into visible growth.");
        ReflectionTestUtils.setField(controller, "inspirationText",
                "LifeForest was inspired by making habit tracking feel more encouraging, reflective, and visual.");
    }

    @Test
    void downloadPageShowsFallbackMessageWhenApkIsMissing() {
        String page = controller.downloadPage();

        assertTrue(page.contains("Download not configured yet"));
    }

    @Test
    void downloadApkReturnsNotFoundWhenApkIsMissing() {
        ResponseStatusException exception =
                assertThrows(ResponseStatusException.class, () -> controller.downloadApk());

        assertTrue(exception.getStatusCode().equals(HttpStatus.NOT_FOUND));
    }

    @Test
    void qrCodeReturnsNotFoundWhenApkIsMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/download/qr.svg");

        ResponseStatusException exception =
                assertThrows(ResponseStatusException.class, () -> controller.qrCode(request));

        assertTrue(exception.getStatusCode().equals(HttpStatus.NOT_FOUND));
    }
}
