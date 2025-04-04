FROM openjdk:17-jdk-slim

# Cloud Run escucha en el puerto 8080
EXPOSE 8080

# Copia el jar a la imagen
COPY build/libs/documentos-0.0.1-SNAPSHOT.jar app.jar

# Ejecuta la aplicación
ENTRYPOINT ["java", "-jar", "/app.jar"] 