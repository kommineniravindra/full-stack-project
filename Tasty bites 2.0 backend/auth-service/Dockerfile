FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY . .

RUN chmod +x mvnw
RUN ./mvnw clean install -DskipTests

EXPOSE 8081

CMD ["java", "-jar", "target/auth-service-0.0.1-SNAPSHOT.jar"]
