package com.documentos.exception

import org.springframework.http.HttpStatus

/**
 * Excepción personalizada para errores de negocio
 * Permite especificar un mensaje y un código de estado HTTP personalizado
 */
class BusinessException(
    override val message: String,
    val status: HttpStatus = HttpStatus.BAD_REQUEST
) : RuntimeException(message) 