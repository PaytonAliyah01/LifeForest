package com.lifeforest.backend.website.controller;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Controller
public class DownloadPageController {

    @Value("${app.download-page.title:LifeForest}")
    private String pageTitle;

    @Value("${app.download-page.description:Build steady habits, stay focused, and grow your forest one session at a time.}")
    private String pageDescription;

    @Value("${app.download-page.apk-url:}")
    private String apkDownloadUrl;

    @Value("${app.download-page.contact-email:elienne.tiffany@gmail.com}")
    private String contactEmail;

    @Value("${app.download-page.developer-name:LifeForest Developer}")
    private String developerName;

    @Value("${app.download-page.developer-bio:Elienne Phelipa is the developer behind LifeForest. The app grew out of reflection on previous semester projects, where lessons about scope management, sustained focus, feedback, and communication showed how much progress depends on structure and consistency. LifeForest brings those lessons into one mobile experience through routines, focus sessions, reflection, analytics, and visual forest growth.}")
    private String developerBio;

    @Value("${app.download-page.inspiration:LifeForest was inspired by the need for a productivity app that supports sustainable growth instead of short-term pressure. Drawing from previous project experience and research into habits, focus, gamification, and reflection, the app combines routine building, timed focus sessions, structured reflection, and visible tree growth so students and young professionals can see their consistency take shape over time.}")
    private String inspirationText;

    @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String home() {
        String body = heroSection() +
                sectionGrid("section-grid",
                        infoCard("Habits that feel alive",
                                "LifeForest helps you track repeating habits, one-time goals, focus time, reflections, and consistency in one place."),
                        infoCard("Growth you can see",
                                "Completed focus sessions grow trees, interrupted ones leave damage, and your forest becomes a visual record of momentum."),
                        infoCard("Built for Android",
                                "Install the latest APK from this site, then log in and start shaping your habit system on your phone.")
                ) +
                sectionGrid("section-grid section-grid-two",
                        infoCard("Quick tour of the site",
                                "<strong>About:</strong> learn what LifeForest is trying to solve and how habits, focus, and reflection work together.",
                                "<strong>FAQ:</strong> find answers about installation, the APK, and how the app behaves.",
                                "<strong>Contact:</strong> get help with setup, bugs, or project questions.",
                                "<strong>Developer:</strong> read about the person behind the app and the thinking behind the project."),
                        infoCard(
                                "About the developer",
                                "<strong>%s</strong>".formatted(escapeHtml(developerName)),
                                escapeHtml(developerBio),
                                "<a class=\"inline-link\" href=\"/developer\">Read the full developer page</a>"
                        )
                ) +
                sectionGrid("section-grid section-grid-two",
                        infoCard("What inspired the app", escapeHtml(inspirationText)),
                        infoCard(
                                "Why that matters",
                                "That inspiration shapes the whole product: the app tries to make discipline feel more supportive through habit check-offs, focus sessions, reflection, and forest growth instead of only pressure and task lists."
                        )
                );

        return renderPage("Home", body);
    }

    @GetMapping(value = "/about", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String about() {
        String body = pageHeader(
                "About LifeForest",
                "A habit tracker designed around consistency, not clutter.",
                escapeHtml(pageDescription)
        ) +
                sectionGrid("section-grid",
                        infoCard("Today view first",
                                "The app brings today’s habits forward so the main action is showing up for what matters right now."),
                        infoCard("Focus supports habits",
                                "Focus sessions are there to help you complete meaningful work, not replace your day-to-day rhythm."),
                        infoCard("Forest as feedback",
                                "Your forest grows from completed effort, giving your consistency a visible reward over days, weeks, and months.")
                ) +
                sectionGrid("section-grid section-grid-two",
                        infoCard("Inspiration", escapeHtml(inspirationText)),
                        infoCard("Design direction",
                                "The app aims to feel calmer and more motivating than a standard tracker by treating progress as something you grow, reflect on, and return to daily.")
                );

        return renderPage("About", body);
    }

    @GetMapping(value = "/faq", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String faq() {
        String body = pageHeader(
                "FAQ",
                "Questions people usually ask before downloading.",
                ""
        ) +
                wrapSection("faq-list",
                        faqItem(
                        "What is LifeForest?",
                        "LifeForest is a habit tracker with focus sessions, reflections, analytics, and a forest that grows from completed work."
                ) +
                        faqItem(
                        "How do I install it?",
                        "Open the download page on this site, tap the download button or scan the QR code, then install the Android APK on your phone."
                ) +
                        faqItem(
                        "Does this page expose the raw APK host?",
                        "No. The public site sends downloads through a server-side route, so visitors do not need the direct file URL."
                ) +
                        faqItem(
                        "Do I need an internet connection?",
                        "You need internet to reach the backend and sync data, especially if your backend is hosted remotely on your VM."
                ));

        return renderPage("FAQ", body);
    }

    @GetMapping(value = "/contact", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String contact() {
        String escapedEmail = escapeHtml(contactEmail);
        String body = pageHeader(
                "Contact",
                "Need help, feedback, or project information?",
                "Reach out if you have installation issues, questions about the habit tracker, or feedback about the experience."
        ) +
                sectionGrid("section-grid section-grid-two",
                        infoCard("Email",
                                "<a class=\"inline-link\" href=\"mailto:%s\">%s</a>".formatted(escapedEmail, escapedEmail)),
                        infoCard("Best topics to send",
                                "Download support, APK install issues, account questions, bug reports, and general project feedback.")
                );

        return renderPage("Contact", body);
    }

    @GetMapping(value = "/developer", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String developer() {
        String escapedTitle = escapeHtml(pageTitle);
        String escapedDeveloperName = escapeHtml(developerName);
        String escapedDeveloperBio = escapeHtml(developerBio);
        String escapedInspiration = escapeHtml(inspirationText);
        String escapedEmail = escapeHtml(contactEmail);
        String body = pageHeader(
                "Developer",
                "Meet the developer behind %s.".formatted(escapedTitle),
                "This page gives a little more context about the person, motivation, and project direction behind the app."
        ) +
                sectionGrid("section-grid section-grid-two",
                        infoCard("Developer", "<strong>%s</strong>".formatted(escapedDeveloperName), escapedDeveloperBio),
                        infoCard("Project focus",
                                "LifeForest is centered on helping people build a daily rhythm through habits, focus sessions, reflections, analytics, and a forest that reflects consistency over time."),
                        infoCard("Why this app exists",
                                "The goal is to make habit tracking feel more motivating and more human by combining structure, reflection, and visual growth instead of only checklists."),
                        infoCard("Inspiration behind LifeForest", escapedInspiration),
                        infoCard("Get in touch",
                                "If you want to ask a question, report a bug, or share feedback, you can reach the developer at <a class=\"inline-link\" href=\"mailto:%s\">%s</a>."
                                        .formatted(escapedEmail, escapedEmail))
                );

        return renderPage("Developer", body);
    }

    @GetMapping(value = "/download", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String downloadPage() {
        String actionSection = apkDownloadUrl.isBlank()
                ? infoCard("Download not configured yet",
                "The APK link has not been connected on this server yet. Please check back after deployment is updated.")
                : sectionGrid("download-layout",
                downloadCard(),
                qrCard()
        );

        String body = pageHeader(
                "Download",
                "Install LifeForest on Android.",
                "Everything starts here: download the app, install it on your phone, and begin building your habit forest."
        ) + actionSection;

        return renderPage("Download", body);
    }

    @GetMapping("/download/apk")
    public ResponseEntity<Void> downloadApk() {
        if (apkDownloadUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "APK download URL is not configured.");
        }

        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, URI.create(apkDownloadUrl).toString())
                .build();
    }

    @GetMapping(value = "/download/qr.svg", produces = "image/svg+xml")
    @ResponseBody
    public ResponseEntity<String> qrCode(HttpServletRequest request) {
        if (apkDownloadUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "APK download URL is not configured.");
        }

        String publicDownloadUrl = ServletUriComponentsBuilder.fromRequestUri(request)
                .replacePath("/download/apk")
                .replaceQuery(null)
                .build()
                .toUriString();

        try {
            return ResponseEntity.ok(generateQrSvg(publicDownloadUrl));
        } catch (WriterException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not generate QR code.", exception);
        }
    }

    private String renderPage(String currentPage, String bodyContent) {
        String title = currentPage.equals("Home")
                ? escapeHtml(pageTitle)
                : escapeHtml(pageTitle + " | " + currentPage);

        return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>%s</title>
                  <style>
                    :root {
                      --bg: #0f1b16;
                      --bg-soft: #13241d;
                      --panel: #14251f;
                      --panel-soft: #1a2d26;
                      --panel-border: #244338;
                      --text: #eaf6f0;
                      --muted: #b7ccc2;
                      --subtle: #98b7a7;
                      --primary: #7ee081;
                      --primary-border: #a5f0af;
                      --primary-text: #102218;
                      --secondary: #1d3a2e;
                      --secondary-border: #4faf7a;
                      --secondary-text: #f3fbf6;
                      --link: #9edcff;
                    }
                    * { box-sizing: border-box; }
                    body {
                      margin: 0;
                      background:
                        radial-gradient(circle at top left, #284739 0%%, transparent 34%%),
                        radial-gradient(circle at top right, #1c352c 0%%, transparent 28%%),
                        linear-gradient(180deg, var(--bg-soft) 0%%, var(--bg) 100%%);
                      color: var(--text);
                      font-family: Arial, sans-serif;
                    }
                    a { color: inherit; }
                    .shell {
                      min-height: 100vh;
                      width: 100%%;
                    }
                    .nav-wrap {
                      position: sticky;
                      top: 0;
                      z-index: 10;
                      backdrop-filter: blur(14px);
                      background: rgba(15, 27, 22, 0.84);
                      border-bottom: 1px solid rgba(36, 67, 56, 0.9);
                    }
                    .nav {
                      width: min(100%%, 1120px);
                      margin: 0 auto;
                      padding: 16px 24px;
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      gap: 16px;
                      flex-wrap: wrap;
                    }
                    .brand {
                      display: flex;
                      align-items: center;
                      gap: 12px;
                      text-decoration: none;
                    }
                    .brand-mark {
                      width: 16px;
                      height: 16px;
                      border-radius: 999px 999px 999px 2px;
                      background: linear-gradient(135deg, #a5f0af 0%%, #4faf7a 100%%);
                      box-shadow: 0 0 0 4px rgba(126, 224, 129, 0.16);
                      transform: rotate(-18deg);
                    }
                    .brand-copy strong {
                      display: block;
                      font-size: 1rem;
                    }
                    .brand-copy span {
                      color: var(--subtle);
                      font-size: 0.86rem;
                    }
                    .nav-links {
                      display: flex;
                      gap: 10px;
                      flex-wrap: wrap;
                    }
                    .nav-link {
                      padding: 10px 14px;
                      border-radius: 999px;
                      text-decoration: none;
                      color: var(--muted);
                      border: 1px solid transparent;
                    }
                    .nav-link.active {
                      background: var(--secondary);
                      border-color: var(--secondary-border);
                      color: var(--secondary-text);
                    }
                    .page {
                      width: min(100%%, 1120px);
                      margin: 0 auto;
                      padding: 40px 24px 64px;
                    }
                    .hero,
                    .page-header {
                      margin-bottom: 28px;
                    }
                    .page > section + section {
                      margin-top: 24px;
                    }
                    .hero {
                      display: grid;
                      grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.9fr);
                      gap: 24px;
                      align-items: stretch;
                    }
                    .hero-copy,
                    .hero-panel,
                    .page-header,
                    .info-card,
                    .faq-item {
                      background: var(--panel);
                      border: 1px solid var(--panel-border);
                      border-radius: 24px;
                      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.24);
                    }
                    .hero-copy,
                    .hero-panel,
                    .page-header {
                      padding: 28px;
                    }
                    .hero-panel {
                      display: grid;
                      gap: 14px;
                      background:
                        linear-gradient(180deg, rgba(126, 224, 129, 0.08) 0%%, rgba(20, 37, 31, 0.9) 100%%),
                        var(--panel);
                    }
                    .mini-stat {
                      padding: 16px 18px;
                      border-radius: 18px;
                      background: var(--panel-soft);
                      border: 1px solid var(--panel-border);
                    }
                    .mini-stat strong {
                      display: block;
                      margin-bottom: 6px;
                      font-size: 1rem;
                    }
                    .mini-stat span {
                      color: var(--muted);
                      line-height: 1.6;
                    }
                    .eyebrow {
                      display: inline-block;
                      margin-bottom: 16px;
                      padding: 8px 12px;
                      border-radius: 999px;
                      background: rgba(126, 224, 129, 0.12);
                      border: 1px solid rgba(165, 240, 175, 0.3);
                      color: var(--primary);
                      font-size: 0.82rem;
                      font-weight: 700;
                      text-transform: uppercase;
                      letter-spacing: 0.08em;
                    }
                    h1, h2 {
                      margin: 0 0 12px;
                    }
                    h1 {
                      font-size: clamp(2.2rem, 5vw, 4rem);
                      line-height: 1.05;
                    }
                    h2 {
                      font-size: 1.2rem;
                    }
                    p {
                      margin: 0;
                      line-height: 1.7;
                    }
                    .hero-text,
                    .page-header p,
                    .info-card p,
                    .faq-item p {
                      color: var(--muted);
                    }
                    .hero-actions {
                      display: flex;
                      gap: 12px;
                      flex-wrap: wrap;
                      margin-top: 24px;
                    }
                    .button {
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      min-height: 50px;
                      padding: 14px 18px;
                      border-radius: 14px;
                      text-decoration: none;
                      font-weight: 700;
                      border: 1px solid transparent;
                    }
                    .button-primary {
                      background: var(--primary);
                      border-color: var(--primary-border);
                      color: var(--primary-text);
                    }
                    .button-secondary {
                      background: var(--secondary);
                      border-color: var(--secondary-border);
                      color: var(--secondary-text);
                    }
                    .section-grid {
                      display: grid;
                      grid-template-columns: repeat(3, minmax(0, 1fr));
                      gap: 24px;
                    }
                    .section-grid-two {
                      grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                    .info-card,
                    .faq-item {
                      padding: 22px;
                    }
                    .faq-list {
                      display: grid;
                      gap: 20px;
                    }
                    .download-layout {
                      display: grid;
                      grid-template-columns: repeat(2, minmax(0, 1fr));
                      gap: 24px;
                    }
                    .qr-panel {
                      text-align: center;
                    }
                    .qr-image {
                      width: min(100%%, 220px);
                      height: auto;
                      background: #ffffff;
                      border-radius: 16px;
                      padding: 12px;
                      margin: 8px auto 0;
                    }
                    .muted {
                      color: var(--muted);
                    }
                    .compact {
                      margin-top: 12px;
                    }
                    .inline-link {
                      color: var(--link);
                      text-decoration: none;
                    }
                    .footer {
                      width: min(100%%, 1120px);
                      margin: 0 auto;
                      padding: 0 24px 40px;
                      color: var(--subtle);
                    }
                    @media (max-width: 900px) {
                      .hero,
                      .section-grid,
                      .section-grid-two,
                      .download-layout {
                        grid-template-columns: 1fr;
                      }
                    }
                    @media (max-width: 640px) {
                      .page {
                        padding-top: 28px;
                      }
                      .hero-copy,
                      .hero-panel,
                      .page-header,
                      .info-card,
                      .faq-item {
                        padding: 22px;
                      }
                      .nav {
                        padding: 14px 18px;
                      }
                    }
                  </style>
                </head>
                <body>
                  <div class="shell">
                    <div class="nav-wrap">
                      <nav class="nav">
                        <a class="brand" href="/">
                          <span class="brand-mark"></span>
                          <span class="brand-copy">
                            <strong>%s</strong>
                            <span>Habit tracker for focused growth</span>
                          </span>
                        </a>
                        <div class="nav-links">
                          %s
                        </div>
                      </nav>
                    </div>
                    <main class="page">
                      %s
                    </main>
                    <footer class="footer">
                      <p>%s</p>
                    </footer>
                  </div>
                </body>
                </html>
                """.formatted(
                title,
                escapeHtml(pageTitle),
                buildNav(currentPage),
                bodyContent,
                escapeHtml(pageTitle + " helps you build habits, focus with intention, and grow a forest from real consistency.")
        );
    }

    private String buildNav(String currentPage) {
        List<NavItem> navItems = List.of(
                new NavItem("Home", "/"),
                new NavItem("About", "/about"),
                new NavItem("FAQ", "/faq"),
                new NavItem("Contact", "/contact"),
                new NavItem("Developer", "/developer"),
                new NavItem("Download", "/download")
        );

        StringBuilder markup = new StringBuilder();

        for (NavItem navItem : navItems) {
            String activeClass = navItem.label().equals(currentPage) ? " active" : "";
            markup.append("<a class=\"nav-link")
                    .append(activeClass)
                    .append("\" href=\"")
                    .append(navItem.href())
                    .append("\">")
                    .append(escapeHtml(navItem.label()))
                    .append("</a>");
        }

        return markup.toString();
    }

    private String heroSection() {
        return """
                <section class="hero">
                  <div class="hero-copy">
                    <span class="eyebrow">Habit tracker + focus companion</span>
                    <h1>Build a calmer daily rhythm with %s.</h1>
                    <p class="hero-text">%s</p>
                    <div class="hero-actions">
                      <a class="button button-primary" href="/download">Download the App</a>
                      <a class="button button-secondary" href="/about">How It Works</a>
                    </div>
                  </div>
                  <div class="hero-panel">
                    %s
                  </div>
                </section>
                """.formatted(
                escapeHtml(pageTitle),
                escapeHtml(pageDescription),
                miniStat("Today first", "See habits due today, streaks, and quick check-offs.") +
                        miniStat("Focused sessions", "Turn intentional work blocks into visible growth in your forest.") +
                        miniStat("Real reflection", "Capture how sessions felt so your routine gets smarter over time.")
        );
    }

    private String pageHeader(String eyebrow, String title, String description) {
        String descriptionMarkup = description.isBlank() ? "" : "<p>%s</p>".formatted(description);
        return """
                <section class="page-header">
                  <span class="eyebrow">%s</span>
                  <h1>%s</h1>
                  %s
                </section>
                """.formatted(eyebrow, title, descriptionMarkup);
    }

    private String sectionGrid(String cssClasses, String... content) {
        return wrapSection(cssClasses, String.join("", content));
    }

    private String wrapSection(String cssClasses, String content) {
        return """
                <section class="%s">
                  %s
                </section>
                """.formatted(cssClasses, content);
    }

    private String infoCard(String title, String... paragraphs) {
        StringBuilder markup = new StringBuilder("""
                <article class="info-card">
                  <h2>%s</h2>
                """.formatted(title));

        for (String paragraph : paragraphs) {
            markup.append("<p>")
                    .append(paragraph)
                    .append("</p>");
        }

        markup.append("</article>");
        return markup.toString();
    }

    private String miniStat(String title, String text) {
        return """
                <div class="mini-stat">
                  <strong>%s</strong>
                  <span>%s</span>
                </div>
                """.formatted(title, text);
    }

    private String downloadCard() {
        return """
                <div class="info-card">
                  <h2>Get the latest Android build</h2>
                  <p>Use the button below to start the download from the server’s secure app route.</p>
                  <a class="button button-primary" href="/download/apk">Download APK</a>
                  <p class="muted compact">The direct APK storage URL is kept behind the server redirect.</p>
                </div>
                """;
    }

    private String qrCard() {
        return """
                <div class="info-card qr-panel">
                  <h2>Scan on your phone</h2>
                  <img class="qr-image" src="/download/qr.svg" alt="QR code to open the LifeForest download page" />
                  <p class="muted compact">This QR code opens the server download route on your phone.</p>
                </div>
                """;
    }

    private String faqItem(String question, String answer) {
        return """
                <article class="faq-item">
                  <h2>%s</h2>
                  <p>%s</p>
                </article>
                """.formatted(escapeHtml(question), escapeHtml(answer));
    }

    private String generateQrSvg(String content) throws WriterException {
        BitMatrix matrix = new QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, 256, 256);
        StringBuilder svg = new StringBuilder();
        svg.append("""
                <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 %d %d" shape-rendering="crispEdges">
                <rect width="100%%" height="100%%" fill="#ffffff"/>
                """.formatted(matrix.getWidth(), matrix.getHeight()));

        for (int y = 0; y < matrix.getHeight(); y++) {
            for (int x = 0; x < matrix.getWidth(); x++) {
                if (matrix.get(x, y)) {
                    svg.append("<rect x=\"")
                            .append(x)
                            .append("\" y=\"")
                            .append(y)
                            .append("\" width=\"1\" height=\"1\" fill=\"#111111\"/>");
                }
            }
        }

        svg.append("</svg>");
        return svg.toString();
    }

    private String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private record NavItem(String label, String href) {
    }
}
