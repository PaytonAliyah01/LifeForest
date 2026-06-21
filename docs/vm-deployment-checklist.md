# VM Deployment Checklist

## Before deploy
- Set `POSTGRES_PASSWORD` to a strong password.
- Set `JWT_SECRET` to a long random value of at least 32 characters.
- Set `APP_CORS_ALLOWED_ORIGINS` only for browser-based frontend origins you actually need.
- Set `APK_DOWNLOAD_URL` if the VM website should offer APK downloads.
- Fill in the website content variables if desired:
  - `DOWNLOAD_PAGE_TITLE`
  - `DOWNLOAD_PAGE_DESCRIPTION`
  - `DOWNLOAD_PAGE_CONTACT_EMAIL`
  - `DOWNLOAD_PAGE_DEVELOPER_NAME`
  - `DOWNLOAD_PAGE_DEVELOPER_BIO`
  - `DOWNLOAD_PAGE_INSPIRATION`

## Firewall and ports
- Expose `8080` only if you want the API and download website publicly reachable.
- Do not expose Postgres publicly.
- In this repo, Compose binds Postgres to `127.0.0.1:5432`, which is safer for VM deployment.

## Deploy
```bash
cd /home/ubuntu
./deploy-backend.sh
```

If environment values changed and you need Compose to recreate services:
```bash
cd /home/ubuntu
docker-compose up -d
```

## Verify
```bash
docker-compose ps
docker-compose logs --tail=100 backend
curl -I http://localhost:8080/
curl -I http://localhost:8080/download
```

## CORS note
- CORS matters for browser-based clients only.
- Expo Go and Android APK/native requests are not blocked by browser CORS.
- If you later host a web frontend on another domain, add that exact origin to `APP_CORS_ALLOWED_ORIGINS`.
