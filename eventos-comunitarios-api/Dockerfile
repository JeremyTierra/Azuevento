FROM eclipse-temurin:17-jdk-alpine AS build

WORKDIR /app

# Copiar archivos de Gradle Wrapper
COPY gradlew ./
COPY gradlew.bat ./
COPY gradle ./gradle

# Dar permisos de ejecución al wrapper
RUN chmod +x ./gradlew

# Copiar archivos de configuración de Gradle
COPY build.gradle settings.gradle ./

# Copiar código fuente
COPY src ./src

# Construir la aplicación usando Gradle Wrapper
RUN ./gradlew build --no-daemon -x test

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copiar el JAR construido
COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
