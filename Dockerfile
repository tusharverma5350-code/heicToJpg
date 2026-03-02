# ── Stage 1: Build React frontend ──────────────────────────────────────────
FROM node:20-slim AS frontend-build
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build


# ── Stage 2: Build Spring Boot JAR ─────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /build
COPY pom.xml .
COPY src/ src/
# Embed the built React app into Spring Boot's static resources so the JAR
# serves both the frontend and the /api endpoints from the same port.
COPY --from=frontend-build /build/dist/ src/main/resources/static/
RUN mvn package -DskipTests


# ── Stage 3: Runtime ───────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-jammy

# Install Node.js 20 — required to run convert-helper.js subprocess
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the fat JAR
COPY --from=backend-build /build/target/*.jar app.jar

# Copy Node.js HEIC conversion helper + its dependencies
COPY convert-helper.js package.json ./
RUN npm install --omit=dev

EXPOSE 3000

ENTRYPOINT ["java", "-jar", "app.jar"]
