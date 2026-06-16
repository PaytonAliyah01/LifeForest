package com.lifeforest.backend.website.controller;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.server.ResponseStatusException;

@Controller
public class DownloadPageController {

    @Value("${app.download-page.title:LifeForest}")
    private String pageTitle;

    @Value("${app.download-page.description:Download the latest Android APK for LifeForest.}")
    private String pageDescription;

    @Value("${app.download-page.apk-url:}")
    private String apkDownloadUrl;

    @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String home() {
        String actionSection = apkDownloadUrl.isBlank()
                ? """
                    <p class="muted">The APK link has not been configured on this server yet.</p>
                    """
                : """
                    <div class="download-layout">
                      <div class="download-copy">
                        <a class="download-button" href="/download">Download APK</a>
                        <p class="muted">If the button does not work, copy this link:</p>
                        <p class="link">%s</p>
                      </div>
                      <div class="qr-panel">
                        <img class="qr-image" src="/download/qr.svg" alt="QR code to download the LifeForest APK" />
                        <p class="muted qr-caption">Scan this QR code on your phone to open the APK download link.</p>
                      </div>
                    </div>
                    """.formatted(apkDownloadUrl);

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
                      --panel: #14251f;
                      --panel-border: #244338;
                      --text: #eaf6f0;
                      --muted: #b7ccc2;
                      --button: #7ee081;
                      --button-text: #102218;
                    }
                    * { box-sizing: border-box; }
                    body {
                      margin: 0;
                      min-height: 100vh;
                      display: grid;
                      place-items: center;
                      background:
                        radial-gradient(circle at top, #1d3a2e 0%%, transparent 45%%),
                        linear-gradient(180deg, #102018 0%%, var(--bg) 100%%);
                      color: var(--text);
                      font-family: Arial, sans-serif;
                      padding: 24px;
                    }
                    .card {
                      width: min(100%%, 680px);
                      background: var(--panel);
                      border: 1px solid var(--panel-border);
                      border-radius: 24px;
                      padding: 32px;
                      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.24);
                    }
                    h1 {
                      margin: 0 0 12px;
                      font-size: clamp(2rem, 5vw, 3rem);
                    }
                    p {
                      margin: 0 0 16px;
                      line-height: 1.6;
                    }
                    .muted {
                      color: var(--muted);
                    }
                    .download-button {
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      min-width: 200px;
                      padding: 14px 20px;
                      border-radius: 14px;
                      background: var(--button);
                      color: var(--button-text);
                      text-decoration: none;
                      font-weight: 700;
                      margin: 8px 0 16px;
                    }
                    .download-layout {
                      display: grid;
                      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                      gap: 24px;
                      align-items: start;
                    }
                    .download-copy,
                    .qr-panel {
                      background: #172923;
                      border: 1px solid var(--panel-border);
                      border-radius: 18px;
                      padding: 20px;
                    }
                    .qr-panel {
                      text-align: center;
                    }
                    .qr-image {
                      width: min(100%%, 220px);
                      height: auto;
                      background: #ffffff;
                      border-radius: 14px;
                      padding: 12px;
                    }
                    .qr-caption {
                      margin-top: 12px;
                    }
                    .link {
                      overflow-wrap: anywhere;
                      color: #9edcff;
                    }
                  </style>
                </head>
                <body>
                  <main class="card">
                    <h1>%s</h1>
                    <p>%s</p>
                    %s
                  </main>
                </body>
                </html>
                """.formatted(pageTitle, pageTitle, pageDescription, actionSection);
    }

    @GetMapping("/download")
    public ResponseEntity<Void> download() {
        if (apkDownloadUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "APK download URL is not configured.");
        }

        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, URI.create(apkDownloadUrl).toString())
                .build();
    }

    @GetMapping(value = "/download/qr.svg", produces = "image/svg+xml")
    @ResponseBody
    public ResponseEntity<String> qrCode() {
        if (apkDownloadUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "APK download URL is not configured.");
        }

        try {
            return ResponseEntity.ok(generateQrSvg(apkDownloadUrl));
        } catch (WriterException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not generate QR code.", exception);
        }
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
}
