package com.documentos.dto

data class UserRegistrationDto(
    val email: String,
    val password: String,
    val name: String
)

data class UserLoginDto(
    val email: String,
    val password: String
)

data class UserResponseDto(
    val id: Long,
    val email: String,
    val name: String
)

data class AuthResponseDto(
    val token: String,
    val user: UserResponseDto
) 