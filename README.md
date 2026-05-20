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

## Testing on a phone with Expo Go
1. Make sure your phone and PC are on the same Wi-Fi network.
2. Use your PC's LAN IP in `EXPO_PUBLIC_API_URL`.
3. Run Expo locally from the `frontend` folder.
4. Scan the QR code in Expo Go.

## Deployment to a virtual machine
For a VM, push your backend and frontend images to Docker Hub first.
Then on the VM:
```powershell
docker compose pull
docker compose up -d
```

For VM deployment of the mobile frontend, build and distribute the Expo app separately. The local development workflow in this repo runs the frontend with Expo outside Docker.

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

## Notes for beginners
- Use [.env.example](.env.example) as your starting point.
- The frontend uses `EXPO_PUBLIC_API_URL` so you do not need to hardcode IP addresses in the source code.
- The backend database and JWT secret can be changed safely through `.env`.

## Project structure
- [backend](backend)
- [frontend](frontend)
- [compose.yaml](compose.yaml)
