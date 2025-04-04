package com.documentos.dto

/**
 * DTO para la respuesta de autenticación.
 * Contiene el token JWT generado.
 */
data class AuthResponse(
    val token: String
) 