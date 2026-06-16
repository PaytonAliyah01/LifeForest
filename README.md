# LifeForest
Mobile-first routine-based productivity and focus platform.

## What is this project?
LifeForest has three parts:
- `backend`: Spring Boot API
- `frontend`: Expo React Native app
- `db`: PostgreSQL database

## What you need
- Docker Desktop
- Node.js 20+ if you want to run the frontend outside Docker
- Java 21 if you want to run the backend outside Docker
- Expo Go on your phone if you want to test the mobile app

## Quick start with Docker
1. Copy [.env.example](.env.example) to `.env`.
2. Fill in the values in `.env`.
3. Run:
```powershell
docker compose up -d
```
4. Check the containers:
```powershell
docker compose ps
```

This starts:
- `db`: PostgreSQL
- `backend`: Spring Boot API

The mobile app is intended to run locally with Expo, not inside Docker.

## What the `.env` file is for
The compose file reads these values from `.env`:
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `BACKEND_IMAGE`
- `DOWNLOAD_PAGE_TITLE`
- `DOWNLOAD_PAGE_DESCRIPTION`
- `APK_DOWNLOAD_URL`
- `EXPO_PUBLIC_API_URL`

## Run the mobile app locally
1. Start the backend and database:
```powershell
docker compose up -d
```
2. Set `EXPO_PUBLIC_API_URL` in `.env` to the backend address your phone or emulator can reach.

Examples:
- Android emulator: `http://10.0.2.2:8080/api`
- iOS simulator or local web testing: `http://localhost:8080/api`
- Real phone on the same Wi-Fi: `http://YOUR-PC-LAN-IP:8080/api`

For example:
```powershell
EXPO_PUBLIC_API_URL=http://192.168.1.50:8080/api
```
3. Install frontend dependencies:
```powershell
cd frontend
npm install
```
4. Start Expo locally:
```powershell
npx expo start
```
5. Open the app:
- In Expo Go on your phone by scanning the QR code
- In an Android emulator with `a`
- In the browser with `w` if you specifically want web

## Start backend locally with one command
If you want to run the backend from source (instead of the backend Docker image), use:

```powershell
.\start-backend-local.ps1
```

What this script does:
- Loads values from `.env` if present.
- Applies safe defaults when values are missing.
- Starts only the `db` container (`docker compose up -d db`).
- Exports `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` for Spring Boot.
- Runs `backend/gradlew bootRun`.

If your database is already running, you can skip Docker startup:

```powershell
.\start-backend-local.ps1 -SkipDocker
```

## Run OWASP Top 10 security checks
Use [docs/owasp-top-10-assessment.md](docs/owasp-top-10-assessment.md) as the assessment checklist.

This project includes repeatable checks that support an OWASP Top 10 review:
- Backend dependency scan: OWASP Dependency-Check through Gradle
- Frontend dependency scan: `npm audit`
- Optional dynamic scan: OWASP ZAP baseline scan

Run both checks from the project root:
```powershell
.\security-check.ps1
```

Run only one side if needed:
```powershell
.\security-check.ps1 -SkipFrontend
.\security-check.ps1 -SkipBackend
```

The backend OWASP report is written to:
```text
backend/build/reports/dependency-check-report.html
```

Run an OWASP ZAP baseline scan after the backend is running:
```powershell
.\security-check.ps1 -SkipBackend -SkipFrontend -ZapTarget http://localhost:8080
```

The backend check fails the build for vulnerabilities with CVSS `7.0` or higher. The first OWASP run can take longer because it downloads vulnerability data.

## Testing on a phone with Expo Go
1. Make sure your phone and PC are on the same Wi-Fi network.
2. Use your PC's LAN IP in `EXPO_PUBLIC_API_URL`.
3. Run Expo locally from the `frontend` folder.
4. Scan the QR code in Expo Go.

## Deployment to a virtual machine
The backend service in [compose.yaml](compose.yaml) now pulls its Docker image from Docker Hub using `BACKEND_IMAGE`.

For a VM deployment:
1. Copy `.env.example` to `.env` on the VM and set the values you need.
2. Make sure `BACKEND_IMAGE` points to the image tag you want to run.
3. Run:
```bash
docker-compose pull backend
docker-compose up -d backend
```

For VM deployment of the mobile frontend, build and distribute the Expo app separately. The local development workflow in this repo runs the frontend with Expo outside Docker.

## Android APK release CD
This repo now includes an Android release workflow:
- [.github/workflows/android-apk-cd.yml](.github/workflows/android-apk-cd.yml)

What it does:
- triggers on version tags like `v1.0.0`
- can also be run manually from GitHub Actions
- calls EAS Build with the `production` profile in [frontend/eas.json](frontend/eas.json)
- waits for the Android APK build and uploads the EAS build details JSON as an artifact

Before it can work, you still need:
1. an Expo account
2. `eas init` run for the project at least once from the `frontend` folder
3. this GitHub Actions secret:
   - `EXPO_TOKEN`

The app identity used for release builds now lives in:
- [frontend/app.json](frontend/app.json)

## Mobile end-to-end testing
This repo now includes the start of a Maestro Cloud E2E setup:
- [.github/workflows/e2e-maestro.yml](.github/workflows/e2e-maestro.yml)
- [.maestro/smoke-interrupted-session.yaml](.maestro/smoke-interrupted-session.yaml)

The first smoke flow covers:
- login
- create routine
- add task
- start focus session
- interrupt session early
- verify reflection opens automatically
- save reflection

To run it, use the `Mobile E2E` workflow manually and provide an `apk_url`.

Required GitHub secrets:
- `MAESTRO_API_KEY`
- `MAESTRO_PROJECT_ID`
- `E2E_LOGIN_EMAIL`
- `E2E_LOGIN_PASSWORD`

The smoke test downloads the APK from the URL you provide, uploads it to Maestro Cloud, and runs the `.maestro` flow tagged `smoke`.

## VM download page
Your backend can now serve a small APK landing page directly from the VM:
- `GET /` shows the page
- `GET /download` redirects to the APK URL
- `GET /download/qr.svg` renders a QR code for the APK link

Set these backend environment variables on the VM:
- `DOWNLOAD_PAGE_TITLE`
- `DOWNLOAD_PAGE_DESCRIPTION`
- `APK_DOWNLOAD_URL`

That means your VM can act as the public download page once you have a real APK link from EAS or GitHub Releases.

## Push images to Docker Hub
Use your Docker Hub username `tiffanyphelipa` when tagging the images:
```powershell
docker login

docker build -f backend/Dockerfile -t tiffanyphelipa/lifeforest-backend:latest ./backend
docker push tiffanyphelipa/lifeforest-backend:latest

docker build -f frontend/Dockerfile -t tiffanyphelipa/lifeforest-frontend:latest ./frontend
docker push tiffanyphelipa/lifeforest-frontend:latest
```

If you want to use a version tag instead of `latest`, replace `latest` with something like `v1.0.0` in both the build and push commands.

## Backend CD
This repo now includes a backend release workflow:
- [.github/workflows/backend-cd.yml](.github/workflows/backend-cd.yml)

What it does:
- builds the backend Docker image from [backend/Dockerfile](backend/Dockerfile)
- pushes it to Docker Hub as `tiffanyphelipa/lifeforest-backend`
- publishes `latest` and `sha-...` tags

Required GitHub secrets:
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

Because public SSH to the VM is currently not reachable from the internet, the deploy step is set up as a VM-side pull flow instead of GitHub directly logging in to the VM.

On the VM:
1. copy [ops/deploy-backend.sh](ops/deploy-backend.sh) to `/home/ubuntu/deploy-backend.sh`
2. make it executable:
```bash
chmod +x /home/ubuntu/deploy-backend.sh
```
3. run it whenever you want to deploy the newest backend image:
```bash
cd /home/ubuntu
./deploy-backend.sh
```

If SSH access from GitHub Actions becomes available later, this workflow can be extended into a fully automatic push-to-VM deploy.

## Notes for beginners
- Use [.env.example](.env.example) as your starting point.
- The frontend uses `EXPO_PUBLIC_API_URL` so you do not need to hardcode IP addresses in the source code.
- The backend database and JWT secret can be changed safely through `.env`.

## Project structure
- [backend](backend)
- [frontend](frontend)
- [compose.yaml](compose.yaml)
