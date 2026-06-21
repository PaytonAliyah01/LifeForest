package com.lifeforest.backend.website.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.lifeforest.backend.common.security.JwtAuthenticationFilter;
import com.lifeforest.backend.common.security.SecurityConfig;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(DownloadPageController.class)
@Import({SecurityConfig.class, DownloadPageControllerMissingApkTest.TestSecurityBeans.class})
@TestPropertySource(properties = {
        "app.download-page.title=LifeForest",
        "app.download-page.description=Build routines, stay focused, reflect with intention, and turn steady progress into visible growth.",
        "app.download-page.apk-url=",
        "app.download-page.contact-email=hello@lifeforest.app",
        "app.download-page.developer-name=Payton",
        "app.download-page.developer-bio=Payton is building LifeForest as a habit tracker that turns consistency into visible growth.",
        "app.download-page.inspiration=LifeForest was inspired by making habit tracking feel more encouraging, reflective, and visual."
})
class DownloadPageControllerMissingApkTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void downloadPageShowsFallbackMessageWhenApkIsMissing() throws Exception {
        mockMvc.perform(get("/download"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Download not configured yet")));
    }

    @Test
    void downloadApkReturnsNotFoundWhenApkIsMissing() throws Exception {
        mockMvc.perform(get("/download/apk"))
                .andExpect(status().isNotFound());
    }

    @Test
    void qrCodeReturnsNotFoundWhenApkIsMissing() throws Exception {
        mockMvc.perform(get("/download/qr.svg"))
                .andExpect(status().isNotFound());
    }

    @TestConfiguration
    static class TestSecurityBeans {

        @Bean
        JwtAuthenticationFilter jwtAuthenticationFilter() {
            return new JwtAuthenticationFilter(null) {
                @Override
                protected void doFilterInternal(
                        HttpServletRequest request,
                        HttpServletResponse response,
                        FilterChain filterChain
                ) throws ServletException, IOException {
                    filterChain.doFilter(request, response);
                }
            };
        }
    }
}
