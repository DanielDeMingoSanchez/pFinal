package com.documentos.service

import com.documentos.config.BusinessException
import com.google.auth.oauth2.GoogleCredentials
import com.google.cloud.storage.BlobId
import com.google.cloud.storage.BlobInfo
import com.google.cloud.storage.Storage
import com.google.cloud.storage.StorageOptions
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.ClassPathResource
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.io.IOException
import java.util.*
import java.util.concurrent.TimeUnit
import java.nio.file.Paths
import java.io.File

/**
 * Servicio para el almacenamiento seguro de archivos en Firebase Storage.
 * Incluye validaciones de seguridad para prevenir ataques.
 */
@Service
class FileStorageService {

    @Value("\${firebase.storage.bucket}")
    private lateinit var storageBucket: String

    @Value("\${firebase.service-account}")
    private lateinit var serviceAccountPath: String

    private val storage: Storage by lazy { initializeFirebaseStorage() }

    /**
     * Inicializa Firebase Storage con las credenciales configuradas
     */
    private fun initializeFirebaseStorage(): Storage {
        return try {
            val serviceAccount = ClassPathResource(serviceAccountPath.replace("classpath:", "")).inputStream
            val credentials = GoogleCredentials.fromStream(serviceAccount)
            StorageOptions.newBuilder()
                .setCredentials(credentials)
                .build()
                .service
        } catch (e: IOException) {
            throw BusinessException(
                status = HttpStatus.INTERNAL_SERVER_ERROR,
                message = "Error al inicializar Firebase Storage: ${e.message}"
            )
        }
    }

    /**
     * Sube un archivo a Firebase Storage con validaciones de seguridad
     * 
     * @param file Archivo a subir
     * @param userId ID del usuario propietario
     * @return URL seguro para acceder al archivo
     */
    fun uploadFile(file: MultipartFile, userId: String): String {
        // Validar el archivo
        if (file.isEmpty) {
            throw BusinessException(
                status = HttpStatus.BAD_REQUEST,
                message = "El archivo está vacío"
            )
        }

        // Verificar el tipo de archivo
        if (!validateFileType(file.contentType)) {
            throw BusinessException(
                status = HttpStatus.BAD_REQUEST,
                message = "Tipo de archivo no permitido: ${file.contentType}"
            )
        }

        // Sanitizar el nombre del archivo
        val originalFilename = file.originalFilename ?: "unnamed_file"
        if (!validateFileName(originalFilename)) {
            throw BusinessException(
                status = HttpStatus.BAD_REQUEST,
                message = "Nombre de archivo no válido: $originalFilename"
            )
        }
        val sanitizedFilename = sanitizeFileName(originalFilename)

        // Generar un nombre único para el archivo
        val timestamp = System.currentTimeMillis()
        val fileId = "${timestamp}_$sanitizedFilename"

        try {
            // Crear la ruta del archivo en Firebase Storage
            val objectName = "documentos/$userId/$fileId"
            val blobId = BlobId.of(storageBucket, objectName)
            val blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(file.contentType)
                .build()

            // Subir el archivo
            storage.create(blobInfo, file.bytes)

            // Generar URL con token de acceso temporal
            return generateSecureUrl(fileId, sanitizedFilename, userId)
        } catch (e: Exception) {
            throw BusinessException(
                status = HttpStatus.INTERNAL_SERVER_ERROR,
                message = "Error al subir el archivo: ${e.message}"
            )
        }
    }

    /**
     * Genera un URL seguro con token de acceso temporal para el archivo
     */
    fun generateSecureUrl(fileId: String, filename: String, userId: String): String {
        val blobId = BlobId.of(storageBucket, "documentos/$userId/$fileId")
        return storage.get(blobId)?.signUrl(7, TimeUnit.DAYS)?.toString()
            ?: throw BusinessException(
                status = HttpStatus.NOT_FOUND,
                message = "Archivo no encontrado"
            )
    }

    /**
     * Elimina un archivo de Firebase Storage
     */
    fun deleteFile(fileId: String, userId: String): Boolean {
        val blobId = BlobId.of(storageBucket, "documentos/$userId/$fileId")
        return storage.delete(blobId)
    }

    /**
     * Valida que el tipo de archivo sea seguro
     */
    fun validateFileType(contentType: String?): Boolean {
        if (contentType == null) return false

        val allowedTypes = setOf(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain",
            "text/csv",
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/svg+xml",
            "application/json",
            "application/xml",
            "text/xml"
        )

        val disallowedTypes = setOf(
            "application/x-msdownload",
            "application/x-sh",
            "application/javascript",
            "text/javascript",
            "application/x-php",
            "application/x-httpd-php",
            "application/java-archive",
            "application/x-executable",
            "application/octet-stream"
        )

        return contentType in allowedTypes && contentType !in disallowedTypes
    }

    /**
     * Valida que el nombre del archivo sea seguro
     */
    fun validateFileName(fileName: String): Boolean {
        if (fileName.isBlank()) return false

        // Verificar path traversal
        if (fileName.contains("../") || fileName.contains("..\\")) return false
        
        // Verificar rutas absolutas
        val path = Paths.get(fileName)
        if (path.isAbsolute) return false
        
        // Verificar caracteres peligrosos
        val dangerousChars = setOf('/', '\\', ':', '*', '?', '"', '<', '>', '|', ';', '%', '$', '&')
        if (fileName.any { it in dangerousChars }) return false
        
        // Verificar null bytes (pueden usarse para bypass)
        if (fileName.contains("\u0000")) return false
        
        // Verificar extensiones peligrosas
        val dangerousExtensions = setOf(".exe", ".php", ".sh", ".bat", ".cmd", ".js", ".vbs")
        if (dangerousExtensions.any { fileName.toLowerCase().endsWith(it) }) return false
        
        return true
    }

    /**
     * Sanitiza el nombre del archivo para hacerlo seguro
     */
    fun sanitizeFileName(fileName: String): String {
        if (fileName.isBlank()) return "unnamed_file"
        
        // Obtener solo el nombre base (sin ruta)
        val baseName = File(fileName).name
        
        // Eliminar caracteres peligrosos
        val sanitized = baseName.replace(Regex("[/\\\\:*?\"<>|;%$&]"), "_")
            .replace("..", "_")
        
        return sanitized
    }
} 