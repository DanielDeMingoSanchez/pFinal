package com.documentos.security

import com.documentos.repository.UsuarioRepository
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service

/**
 * Implementación de UserDetailsService que carga los detalles
 * del usuario desde el repositorio de usuarios.
 */
@Service
class UserDetailsServiceImpl(
    private val usuarioRepository: UsuarioRepository
) : UserDetailsService {
    
    override fun loadUserByUsername(username: String): UserDetails {
        val usuario = usuarioRepository.findByEmail(username)
            ?: throw UsernameNotFoundException("Usuario no encontrado con email: $username")
            
        return UserDetailsImpl(usuario)
    }
} 