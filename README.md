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

## What the `.env` file is for
The compose file reads these values from `.env`:
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `BACKEND_IMAGE`
- `FRONTEND_IMAGE`
- `EXPO_PUBLIC_API_URL`

## Testing on a phone with Expo Go
If you want to test the mobile app on a real phone:
1. Make sure your phone and PC are on the same Wi-Fi network.
2. Set `EXPO_PUBLIC_API_URL` to your backend address, for example:
```powershell
EXPO_PUBLIC_API_URL=http://145.220.72.98:8080/api
```
3. Start the frontend container with Expo running in LAN mode.
4. Open Expo Go and connect to the app URL shown by Expo.

## Deployment to a virtual machine
For a VM, push your backend and frontend images to Docker Hub first.
Then on the VM:
```powershell
docker compose pull
docker compose up -d
```

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
