package com.documentos.service

import com.documentos.dto.UserRegistrationDto
import com.documentos.dto.UserResponseDto
import com.documentos.model.User
import com.documentos.repository.UserRepository
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UserService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder
) {
    @Transactional
    fun registerUser(registrationDto: UserRegistrationDto): UserResponseDto {
        if (userRepository.existsByEmail(registrationDto.email)) {
            throw IllegalStateException("Email already exists")
        }

        val user = User(
            email = registrationDto.email,
            password = passwordEncoder.encode(registrationDto.password),
            name = registrationDto.name
        )

        val savedUser = userRepository.save(user)
        return UserResponseDto(
            id = savedUser.id!!,
            email = savedUser.email,
            name = savedUser.name
        )
    }

    fun getUserById(id: Long): UserResponseDto {
        val user = userRepository.findById(id)
            .orElseThrow { NoSuchElementException("User not found") }
        
        return UserResponseDto(
            id = user.id!!,
            email = user.email,
            name = user.name
        )
    }

    fun getUserByEmail(email: String): User {
        return userRepository.findByEmail(email)
            ?: throw RuntimeException("Usuario no encontrado con email: $email")
    }
} 