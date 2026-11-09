FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY . .

RUN chmod +x mvnw
RUN ./mvnw clean install -DskipTests

EXPOSE 8082

CMD ["java", "-jar", "target/product-service-0.0.1-SNAPSHOT.jar"]
