# Stage 1: Build
FROM maven:3.9.8-eclipse-temurin-17 AS builder

WORKDIR /build

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN apk add --no-cache curl

RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=builder /build/target/*.jar app.jar

USER spring:spring

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]