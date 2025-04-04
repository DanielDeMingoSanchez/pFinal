package com.documentos.config

import com.google.auth.oauth2.GoogleCredentials
import com.google.cloud.storage.Storage
import com.google.cloud.storage.StorageOptions
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.database.FirebaseDatabase
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.ClassPathResource
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory

@Configuration
class FirebaseConfig {
    
    private val logger = LoggerFactory.getLogger(FirebaseConfig::class.java)
    
    @Value("\${firebase.service-account}")
    private lateinit var serviceAccountPath: String
    
    @Value("\${firebase.database.url}")
    private lateinit var databaseUrl: String
    
    @PostConstruct
    fun initialize() {
        try {
            // Evitar inicializar múltiples veces
            if (FirebaseApp.getApps().isEmpty()) {
                val serviceAccount = ClassPathResource(serviceAccountPath.replace("classpath:", "")).inputStream
                val credentials = GoogleCredentials.fromStream(serviceAccount)
                
                val options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .setDatabaseUrl(databaseUrl)
                    .build()
                
                FirebaseApp.initializeApp(options)
                logger.info("Firebase inicializado correctamente")
            }
        } catch (e: Exception) {
            logger.error("Error inicializando Firebase: ${e.message}", e)
            throw RuntimeException("Error inicializando Firebase", e)
        }
    }

    @Bean
    fun firebaseStorage(): Storage {
        val serviceAccount = ClassPathResource(serviceAccountPath.replace("classpath:", "")).inputStream
        val credentials = GoogleCredentials.fromStream(serviceAccount)
        return StorageOptions.newBuilder()
            .setCredentials(credentials)
            .build()
            .service
    }
    
    @Bean
    fun firebaseDatabase(): FirebaseDatabase {
        return FirebaseDatabase.getInstance()
    }
} 