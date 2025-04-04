package com.documentos.config

import org.springframework.http.HttpStatus

/**
 * Excepción personalizada para errores de lógica de negocio.
 * Permite especificar un código de estado HTTP y un mensaje personalizado.
 */
class BusinessException(
    val status: HttpStatus,
    override val message: String? = null,
    cause: Throwable? = null
) : RuntimeException(message, cause) 