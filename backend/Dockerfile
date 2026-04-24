FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /workspace

RUN apt-get update \
	&& apt-get upgrade -y \
	&& rm -rf /var/lib/apt/lists/*

COPY gradlew gradlew.bat settings.gradle build.gradle ./
COPY gradle ./gradle
COPY src ./src

RUN chmod +x gradlew
RUN ./gradlew bootJar --no-daemon
RUN JAR_FILE=$(find build/libs -maxdepth 1 -name "*.jar" | grep -v "plain" | head -n 1) && cp "$JAR_FILE" app.jar

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN apk upgrade --no-cache

COPY --from=builder /workspace/app.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
