package com.documentos.config

import com.documentos.dto.ErrorResponse
import com.documentos.exception.BusinessException
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.context.request.WebRequest
import java.time.LocalDateTime
import jakarta.persistence.EntityNotFoundException

/**
 * Manejador global de excepciones para la aplicación.
 * Captura diferentes tipos de excepciones y las transforma en respuestas HTTP apropiadas.
 */
@ControllerAdvice
class GlobalExceptionHandler {

    private val logger = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)

    /**
     * Maneja excepciones genéricas
     */
    @ExceptionHandler(Exception::class)
    fun handleAllExceptions(ex: Exception, request: WebRequest): ResponseEntity<ErrorResponse> {
        logger.error("Error no esperado", ex)
        
        val errorDetails = ErrorResponse(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
            error = "Error interno del servidor",
            message = "Ha ocurrido un error inesperado. Por favor contacte al administrador.",
            path = request.getDescription(false).substring("uri=".length)
        )
        
        return ResponseEntity(errorDetails, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    /**
     * Maneja excepciones de validación de datos
     */
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationExceptions(ex: MethodArgumentNotValidException, request: WebRequest): ResponseEntity<ErrorResponse> {
        val errors = ex.bindingResult
            .fieldErrors
            .map { "${it.field}: ${it.defaultMessage}" }
            .toList()
            
        logger.warn("Error de validación: $errors")
        
        val errorDetails = ErrorResponse(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.BAD_REQUEST.value(),
            error = "Error de validación",
            message = errors.joinToString(", "),
            path = request.getDescription(false).substring("uri=".length)
        )
        
        return ResponseEntity(errorDetails, HttpStatus.BAD_REQUEST)
    }

    /**
     * Maneja excepciones de entidad no encontrada
     */
    @ExceptionHandler(EntityNotFoundException::class)
    fun handleEntityNotFoundException(ex: EntityNotFoundException, request: WebRequest): ResponseEntity<ErrorResponse> {
        logger.warn("Entidad no encontrada", ex)
        
        val errorDetails = ErrorResponse(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.NOT_FOUND.value(),
            error = "Recurso no encontrado",
            message = ex.message ?: "El recurso solicitado no existe",
            path = request.getDescription(false).substring("uri=".length)
        )
        
        return ResponseEntity(errorDetails, HttpStatus.NOT_FOUND)
    }

    /**
     * Maneja excepciones de acceso denegado
     */
    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDeniedException(ex: AccessDeniedException, request: WebRequest): ResponseEntity<ErrorResponse> {
        logger.warn("Acceso denegado", ex)
        
        val errorDetails = ErrorResponse(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.FORBIDDEN.value(),
            error = "Acceso denegado",
            message = "No tiene permisos suficientes para acceder a este recurso",
            path = request.getDescription(false).substring("uri=".length)
        )
        
        return ResponseEntity(errorDetails, HttpStatus.FORBIDDEN)
    }
    
    /**
     * Maneja excepciones de credenciales incorrectas
     */
    @ExceptionHandler(BadCredentialsException::class)
    fun handleBadCredentialsException(ex: BadCredentialsException, request: WebRequest): ResponseEntity<ErrorResponse> {
        logger.warn("Credenciales incorrectas", ex)
        
        val errorDetails = ErrorResponse(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.UNAUTHORIZED.value(),
            error = "Error de autenticación",
            message = "Credenciales incorrectas",
            path = request.getDescription(false).substring("uri=".length)
        )
        
        return ResponseEntity(errorDetails, HttpStatus.UNAUTHORIZED)
    }
    
    /**
     * Maneja excepciones personalizadas de negocio
     */
    @ExceptionHandler(BusinessException::class)
    fun handleBusinessException(ex: BusinessException, request: WebRequest): ResponseEntity<ErrorResponse> {
        logger.warn("Error de negocio", ex)
        
        val errorDetails = ErrorResponse(
            timestamp = LocalDateTime.now(),
            status = ex.status.value(),
            error = ex.status.reasonPhrase,
            message = ex.message ?: "Error en la lógica de negocio",
            path = request.getDescription(false).substring("uri=".length)
        )
        
        return ResponseEntity(errorDetails, ex.status)
    }
} 