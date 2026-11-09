# ---- 1) Compilar con Maven ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

# ---- 2) Imagen liviana solo con Java ----
FROM eclipse-temurin:21-jre
WORKDIR /app
ENV TZ=America/Lima
COPY --from=build /app/target/*.jar app.jar
# Render asigna el puerto en la variable PORT (application.properties ya la lee).
EXPOSE 3200
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-Duser.timezone=America/Lima", "-jar", "app.jar"]
