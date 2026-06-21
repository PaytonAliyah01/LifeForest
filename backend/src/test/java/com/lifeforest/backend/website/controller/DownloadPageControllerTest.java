package com.lifeforest.backend.website.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.lifeforest.backend.common.security.JwtAuthenticationFilter;
import com.lifeforest.backend.common.security.SecurityConfig;

@WebMvcTest(DownloadPageController.class)
@Import({SecurityConfig.class, DownloadPageControllerTest.TestSecurityBeans.class})
@TestPropertySource(properties = {
        "app.download-page.title=LifeForest",
        "app.download-page.description=Build steady habits, stay focused, and grow your forest one session at a time.",
        "app.download-page.apk-url=https://example.com/lifeforest.apk",
        "app.download-page.contact-email=hello@lifeforest.app",
        "app.download-page.developer-name=Payton",
        "app.download-page.developer-bio=Payton is building LifeForest as a habit tracker that turns consistency into visible growth.",
        "app.download-page.inspiration=LifeForest was inspired by making habit tracking feel more encouraging, reflective, and visual."
})
class DownloadPageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void homeRendersMarketingSiteWithoutExposingRawApkUrl() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/html"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Habit tracker + focus companion")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("href=\"/about\"")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("What inspired the app")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Read the full developer page")))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("https://example.com/lifeforest.apk"))));
    }

    @Test
    void downloadPageRendersProtectedDownloadRoute() throws Exception {
        mockMvc.perform(get("/download"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/html"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("href=\"/download/apk\"")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("/download/qr.svg")))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("https://example.com/lifeforest.apk"))));
    }

    @Test
    void downloadApkRedirectsToConfiguredApkUrl() throws Exception {
        mockMvc.perform(get("/download/apk"))
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

    @Test
    void aboutFaqAndContactPagesRender() throws Exception {
        mockMvc.perform(get("/about"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("About LifeForest")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Inspiration")));

        mockMvc.perform(get("/faq"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("FAQ")));

        mockMvc.perform(get("/contact"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("hello@lifeforest.app")));

        mockMvc.perform(get("/developer"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Meet the developer behind")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Payton")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Inspiration behind LifeForest")));
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
