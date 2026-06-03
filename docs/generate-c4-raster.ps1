Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "."
$pngPath = Join-Path $outDir "lifeforest-c4-diagram.png"
$jpgPath = Join-Path $outDir "lifeforest-c4-diagram.jpg"

$width = 2000
$height = 1300
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

function Brush($hex) {
    return New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($hex))
}

function Pen($hex, $width = 2) {
    return New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml($hex), $width)
}

function Font($size, $style = "Regular") {
    return New-Object System.Drawing.Font("Arial", $size, [System.Drawing.FontStyle]::$style)
}

function RoundRectPath($x, $y, $w, $h, $r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

function DrawBox($x, $y, $w, $h, $fill, $stroke, $title, $lines) {
    $path = RoundRectPath $x $y $w $h 14
    $graphics.FillPath((Brush $fill), $path)
    $graphics.DrawPath((Pen $stroke 2), $path)
    $graphics.DrawString($title, (Font 19 Bold), (Brush "#0f172a"), $x + 28, $y + 28)
    $lineY = $y + 58
    foreach ($line in $lines) {
        $graphics.DrawString($line, (Font 15), (Brush "#334155"), $x + 28, $lineY)
        $lineY += 25
    }
}

function DrawText($text, $x, $y, $size, $style, $color) {
    $graphics.DrawString($text, (Font $size $style), (Brush $color), $x, $y)
}

function DrawArrow($x1, $y1, $x2, $y2, $dashed = $false) {
    $p = Pen "#334155" 2.5
    if ($dashed) {
        $p.Color = [System.Drawing.ColorTranslator]::FromHtml("#64748b")
        $p.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
    }
    $cap = New-Object System.Drawing.Drawing2D.AdjustableArrowCap(5, 6)
    $p.CustomEndCap = $cap
    $graphics.DrawLine($p, $x1, $y1, $x2, $y2)
}

$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml("#f8fafc"))

DrawText "LifeForest C4 Architecture" 80 58 42 Bold "#0f172a"
DrawText "Mobile-first routine, task, and focus-session platform built with Expo React Native, Spring Boot, and PostgreSQL." 82 118 20 Regular "#475569"

DrawText "Level 1 and 2: System Context and Containers" 80 190 24 Bold "#0f172a"

DrawBox 80 250 310 125 "#fff7ed" "#f97316" "LifeForest user" @("Creates routines and tasks", "Runs focus sessions")
DrawBox 550 240 380 150 "#ecfeff" "#0891b2" "Mobile app" @("Expo, React Native, TypeScript", "Login, routines, tasks, focus UI", "Uses Axios API client")
DrawBox 550 470 380 120 "#f0fdf4" "#16a34a" "Device local storage" @("React Native AsyncStorage", "Stores JWT access token")
DrawBox 1160 240 420 150 "#eef2ff" "#4f46e5" "Backend API" @("Spring Boot 3, Java 21", "REST endpoints and business logic", "Runs on port 8080")
DrawBox 1160 470 420 120 "#fdf2f8" "#db2777" "PostgreSQL database" @("PostgreSQL 16", "Users, routines, tasks, sessions")
DrawBox 1680 325 280 150 "#f1f5f9" "#64748b" "Docker Compose" @("Starts backend", "and database", "Mobile runs via Expo")

DrawArrow 390 312 550 312
DrawText "uses" 448 287 13 Regular "#64748b"
DrawArrow 930 312 1160 312
DrawText "HTTP JSON REST API" 970 270 13 Regular "#64748b"
DrawText "Bearer JWT" 970 292 13 Regular "#64748b"
DrawArrow 740 390 740 470
DrawText "reads/writes token" 765 431 13 Regular "#64748b"
DrawArrow 1370 390 1370 470
DrawText "JPA / JDBC" 1395 431 13 Regular "#64748b"
DrawArrow 1680 375 1580 315 $true
DrawArrow 1680 430 1580 525 $true

DrawText "Level 3: Backend Components" 80 705 24 Bold "#0f172a"
$boundary = RoundRectPath 80 750 1840 410 18
$graphics.FillPath((Brush "#f8fafc"), $boundary)
$graphics.DrawPath((Pen "#cbd5e1" 2), $boundary)
DrawText "Spring Boot Backend API container" 108 775 13 Regular "#64748b"

DrawBox 120 835 280 100 "#ffffff" "#94a3b8" "Controllers" @("Auth, users, routines,", "tasks, focus sessions")
DrawBox 500 815 280 120 "#eef2ff" "#6366f1" "AuthService" @("Validates credentials", "Issues signed JWTs")
DrawBox 500 990 280 120 "#eef2ff" "#6366f1" "Domain services" @("User, routine, task,", "focus-session logic")
DrawBox 880 815 280 120 "#ffffff" "#94a3b8" "SecurityConfig" @("Password encoder", "HTTP security rules")
DrawBox 880 990 280 120 "#ffffff" "#94a3b8" "JwtService" @("Creates and validates", "signed JWTs")
DrawBox 1260 835 290 100 "#ffffff" "#94a3b8" "Repositories" @("Spring Data JPA", "User, routine, task, session")
DrawBox 1640 835 220 100 "#fdf2f8" "#db2777" "Database" @("PostgreSQL", "Persistent data")

DrawArrow 400 880 500 875
DrawArrow 400 900 500 1045
DrawArrow 780 875 880 875
DrawArrow 780 1045 880 1045
DrawArrow 1160 875 1260 875
DrawArrow 1160 1045 1260 900
DrawArrow 1550 885 1640 885

DrawText "Key data: User owns routines; routines contain tasks; users start focus sessions; sessions may track a task." 80 1220 24 Bold "#0f172a"

$bitmap.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

$jpgEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 92L)
$bitmap.Save($jpgPath, $jpgEncoder, $encoderParams)

$graphics.Dispose()
$bitmap.Dispose()

Write-Host "Created $pngPath"
Write-Host "Created $jpgPath"
