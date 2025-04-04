package com.documentos.security

import com.documentos.repository.UserRepository
import org.springframework.context.annotation.Primary
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Primary
class CustomUserDetailsService(
    private val userRepository: UserRepository
) : UserDetailsService {

    @Transactional
    override fun loadUserByUsername(username: String): UserDetails {
        val user = userRepository.findByEmail(username)
            ?: throw UsernameNotFoundException("Usuario no encontrado con email: $username")

        return User.builder()
            .username(user.email)
            .password(user.password)
            .roles("USER")
            .build()
    }

    @Transactional
    fun loadUserById(id: Long): UserDetails {
        val user = userRepository.findById(id)
            .orElseThrow { UsernameNotFoundException("User not found with id: $id") }
        
        return UserPrincipal.create(user)
    }

    companion object {
        fun loadUserById(id: Long): UserDetails {
            // Implementar lógica para cargar usuario por ID si es necesario
            return User.builder()
                .username("temp")
                .password("temp")
                .roles("USER")
                .build()
        }
    }
} 