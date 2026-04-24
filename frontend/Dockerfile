FROM alpine:3.22
WORKDIR /app

RUN apk add --no-cache nodejs npm python3 make g++ \
	&& apk upgrade --no-cache

COPY package*.json ./
RUN npm ci

COPY . .

ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

EXPOSE 8081
EXPOSE 19000
EXPOSE 19001
CMD ["npx", "expo", "start", "--lan", "--port", "8081"]
