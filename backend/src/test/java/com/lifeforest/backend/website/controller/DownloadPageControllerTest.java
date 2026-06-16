package com.lifeforest.backend.website.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.lifeforest.backend.common.security.SecurityConfig;

@WebMvcTest(DownloadPageController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = {
        "app.download-page.title=LifeForest",
        "app.download-page.description=Download the latest Android APK for LifeForest.",
        "app.download-page.apk-url=https://example.com/lifeforest.apk"
})
class DownloadPageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void homeRendersDownloadPage() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/html"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Download APK")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("https://example.com/lifeforest.apk")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("/download/qr.svg")));
    }

    @Test
    void downloadRedirectsToConfiguredApkUrl() throws Exception {
        mockMvc.perform(get("/download"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "https://example.com/lifeforest.apk"));
    }

    @Test
    void qrCodeRendersAsSvg() throws Exception {
        mockMvc.perform(get("/download/qr.svg"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("image/svg+xml"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("<svg")));
    }
}
