param(
    [switch]$SkipDocker
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($repoRoot)) {
    $repoRoot = (Get-Location).Path
}

function Set-EnvIfMissing {
    param(
        [string]$Name,
        [string]$Value
    )

    $currentValue = [Environment]::GetEnvironmentVariable($Name, 'Process')

    if ([string]::IsNullOrWhiteSpace($currentValue)) {
        Set-Item -Path "Env:$Name" -Value $Value
    }
}

function Import-DotEnv {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        return
    }

    Get-Content -Path $Path | ForEach-Object {
        $line = $_.Trim()

        if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith('#')) {
            return
        }

        $separatorIndex = $line.IndexOf('=')
        if ($separatorIndex -lt 1) {
            return
        }

        $key = $line.Substring(0, $separatorIndex).Trim()
        $value = $line.Substring($separatorIndex + 1).Trim()

        $existingValue = [Environment]::GetEnvironmentVariable($key, 'Process')
        if ([string]::IsNullOrWhiteSpace($existingValue)) {
            Set-Item -Path "Env:$key" -Value $value
        }
    }
}

Set-Location $repoRoot

Import-DotEnv -Path (Join-Path $repoRoot '.env')

Set-EnvIfMissing -Name 'POSTGRES_DB' -Value 'lifeforest'
Set-EnvIfMissing -Name 'POSTGRES_USER' -Value 'postgres'
Set-EnvIfMissing -Name 'POSTGRES_PASSWORD' -Value 'lifeforest123'

# Always refresh the JWT secret so a stale short secret from the parent shell does not leak through.
Set-Item -Path 'Env:JWT_SECRET' -Value 'lifeforest-dev-jwt-secret-key-32chars'

Set-EnvIfMissing -Name 'DB_URL' -Value ("jdbc:postgresql://localhost:5432/{0}" -f $env:POSTGRES_DB)
Set-EnvIfMissing -Name 'DB_USERNAME' -Value $env:POSTGRES_USER
Set-EnvIfMissing -Name 'DB_PASSWORD' -Value $env:POSTGRES_PASSWORD

if (-not $SkipDocker) {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Host 'Starting database container (db)...'
        docker compose up -d db | Out-Null
    }
    else {
        Write-Warning 'Docker command not found. Skipping db startup. Use -SkipDocker to suppress this warning.'
    }
}

Set-Location (Join-Path $repoRoot 'backend')
Write-Host 'Starting backend with Gradle bootRun...'
./gradlew bootRun