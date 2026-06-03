param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [string]$ZapTarget
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $Root "backend"
$FrontendDir = Join-Path $Root "frontend"
$ReportsDir = Join-Path $Root "security-reports"

function Invoke-Step {
    param(
        [string]$Title,
        [scriptblock]$Command
    )

    Write-Host ""
    Write-Host "==> $Title" -ForegroundColor Cyan
    & $Command
}

if (-not $SkipBackend) {
    Invoke-Step "OWASP Dependency-Check for backend" {
        Push-Location $BackendDir
        try {
            .\gradlew.bat dependencyCheckAnalyze
            if ($LASTEXITCODE -ne 0) {
                throw "OWASP Dependency-Check failed with exit code $LASTEXITCODE."
            }
        }
        finally {
            Pop-Location
        }
    }
}

if (-not $SkipFrontend) {
    Invoke-Step "npm audit for frontend" {
        Push-Location $FrontendDir
        try {
            npm audit --audit-level=high
            if ($LASTEXITCODE -ne 0) {
                throw "npm audit failed with exit code $LASTEXITCODE."
            }
        }
        finally {
            Pop-Location
        }
    }
}

if ($ZapTarget) {
    Invoke-Step "OWASP ZAP baseline scan for $ZapTarget" {
        New-Item -ItemType Directory -Force -Path $ReportsDir | Out-Null
        docker run --rm `
            -v "${ReportsDir}:/zap/wrk/:rw" `
            ghcr.io/zaproxy/zaproxy:stable `
            zap-baseline.py `
            -t $ZapTarget `
            -r zap-baseline-report.html `
            -J zap-baseline-report.json

        if ($LASTEXITCODE -gt 1) {
            throw "OWASP ZAP baseline scan failed with exit code $LASTEXITCODE."
        }
    }
}

Write-Host ""
Write-Host "Security checks complete." -ForegroundColor Green
Write-Host "Backend reports: backend/build/reports/dependency-check-report.html and .json"
if ($ZapTarget) {
    Write-Host "ZAP reports: security-reports/zap-baseline-report.html and .json"
}
