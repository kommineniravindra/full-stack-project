FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY . .

RUN chmod +x mvnw
RUN ./mvnw clean install -DskipTests

EXPOSE 8084

CMD ["java", "-jar", "target/analytics-service-0.0.1-SNAPSHOT.jar"]
