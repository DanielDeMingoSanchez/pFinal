package com.documentos.dto

import java.time.LocalDateTime

/**
 * DTO para respuestas de error estandarizadas.
 */
data class ErrorResponse(
    val timestamp: LocalDateTime,
    val status: Int,
    val error: String,
    val message: String,
    val path: String
) 