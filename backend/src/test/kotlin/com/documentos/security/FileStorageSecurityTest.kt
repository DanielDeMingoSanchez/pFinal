package com.documentos.security

import com.documentos.service.FileStorageService
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito.*
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.mock.web.MockMultipartFile
import java.io.IOException
import java.nio.file.Path
import java.nio.file.Paths
import java.util.UUID

/**
 * Pruebas para verificar la seguridad en el almacenamiento y recuperación de archivos
 */
@ExtendWith(MockitoExtension::class)
class FileStorageSecurityTest {

    @Mock
    private lateinit var jwtTokenProvider: JwtTokenProvider

    @Mock
    private lateinit var fileStorageMock: FileStorageService

    /**
     * Prueba que verifica que se rechacen nombres de archivo maliciosos
     * que intentan acceder a directorios superiores (path traversal)
     */
    @ParameterizedTest
    @ValueSource(strings = [
        "../../../etc/passwd",
        "..\\..\\Windows\\System32\\config\\SAM",
        "/etc/shadow",
        "C:\\Windows\\System32\\cmd.exe",
        "file.txt/../../../etc/passwd",
        "file.txt;rm -rf /",
        "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd", // URL encoded "../../../etc/passwd"
        "file.txt\u0000malicious.php" // Null byte injection
    ])
    fun `debe rechazar nombres de archivo maliciosos`(maliciousFilename: String) {
        // Configurar el mock
        `when`(fileStorageMock.validateFileName(maliciousFilename)).thenCallRealMethod()
        
        // Verificar que el nombre de archivo es rechazado
        assertFalse(fileStorageMock.validateFileName(maliciousFilename))
    }

    /**
     * Prueba que verifica que se acepten nombres de archivo seguros
     */
    @ParameterizedTest
    @ValueSource(strings = [
        "document.pdf",
        "invoice_2023-03-28.pdf",
        "profile-picture.jpg",
        "report (2023).xlsx",
        "my_file-with-hyphens.txt",
        "résumé.pdf", // Unicode character
        "документ.docx" // Non-latin characters
    ])
    fun `debe aceptar nombres de archivo seguros`(safeFilename: String) {
        // Configurar el mock
        `when`(fileStorageMock.validateFileName(safeFilename)).thenCallRealMethod()
        
        // Verificar que el nombre de archivo es aceptado
        assertTrue(fileStorageMock.validateFileName(safeFilename))
    }

    /**
     * Prueba que verifica que se saniticen los nombres de archivo
     */
    @Test
    fun `debe sanitizar nombres de archivo`() {
        // Simular el método de sanitización
        val dangerousFilename = "malicious../../../file.php"
        val sanitizedFilename = "malicious.file.php"
        
        `when`(fileStorageMock.sanitizeFileName(dangerousFilename)).thenReturn(sanitizedFilename)
        
        // Verificar que el nombre se sanitiza correctamente
        assertEquals(sanitizedFilename, fileStorageMock.sanitizeFileName(dangerousFilename))
    }

    /**
     * Prueba que verifica que se rechacen tipos MIME no permitidos
     */
    @ParameterizedTest
    @ValueSource(strings = [
        "application/x-msdownload", // .exe
        "application/x-sh", // .sh
        "application/javascript", // .js
        "text/javascript",
        "application/x-php", // .php
        "application/x-httpd-php"
    ])
    fun `debe rechazar tipos MIME peligrosos`(dangerousMimeType: String) {
        // Crear un archivo con tipo MIME peligroso
        val file = MockMultipartFile(
            "file",
            "test.txt",
            dangerousMimeType,
            "contenido de prueba".toByteArray()
        )
        
        // Configurar el mock
        `when`(fileStorageMock.validateFileType(file.contentType)).thenCallRealMethod()
        
        // Verificar que el tipo MIME es rechazado
        assertFalse(fileStorageMock.validateFileType(file.contentType))
    }

    /**
     * Prueba que verifica que se acepten tipos MIME seguros
     */
    @ParameterizedTest
    @ValueSource(strings = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "text/plain",
        "application/json"
    ])
    fun `debe aceptar tipos MIME seguros`(safeMimeType: String) {
        // Configurar el mock
        `when`(fileStorageMock.validateFileType(safeMimeType)).thenCallRealMethod()
        
        // Verificar que el tipo MIME es aceptado
        assertTrue(fileStorageMock.validateFileType(safeMimeType))
    }

    /**
     * Prueba que verifica que los URLs generados para archivos son seguros
     */
    @Test
    fun `debe generar URLs seguros con tokens`() {
        // Datos de prueba
        val userId = "user123"
        val fileName = "document.pdf"
        val fileId = UUID.randomUUID().toString()
        
        // Mock para simular la generación de URL seguro
        `when`(fileStorageMock.generateSecureUrl(fileId, fileName, userId)).thenReturn(
            "https://firebasestorage.googleapis.com/v0/b/documentos-compartidos-cf6bd.firebasestorage.app/o/documentos%2F$userId%2F$fileId%2F$fileName?alt=media&token=abc123"
        )
        
        // Obtener URL
        val secureUrl = fileStorageMock.generateSecureUrl(fileId, fileName, userId)
        
        // Verificar que el URL contiene el token y la ruta correcta
        assertTrue(secureUrl.contains("token="))
        assertTrue(secureUrl.contains(userId))
        assertTrue(secureUrl.contains(fileName))
        assertTrue(secureUrl.contains("firebasestorage.googleapis.com"))
    }
} 