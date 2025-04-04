package com.documentos.service

import com.documentos.dto.LoginRequest
import com.documentos.dto.RegistroRequest
import com.documentos.model.Usuario
import com.documentos.repository.UsuarioRepository
import jakarta.persistence.EntityExistsException
import jakarta.persistence.EntityNotFoundException
import org.slf4j.LoggerFactory
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * Servicio para la gestión de usuarios.
 * Incluye operaciones de registro, autenticación y consulta.
 */
@Service
class UsuarioService(
    private val usuarioRepository: UsuarioRepository,
    private val passwordEncoder: PasswordEncoder
) {
    private val logger = LoggerFactory.getLogger(UsuarioService::class.java)

    /**
     * Verifica si existe un usuario con el email dado
     */
    fun existsByEmail(email: String): Boolean {
        return usuarioRepository.existsByEmail(email)
    }

    /**
     * Registra un nuevo usuario en el sistema
     */
    @Transactional
    fun registrarUsuario(request: RegistroRequest): Usuario {
        // Verificar si el email ya existe
        if (existsByEmail(request.email)) {
            logger.warn("Intento de registro con email existente: ${request.email}")
            throw EntityExistsException("Ya existe un usuario con el email ${request.email}")
        }
        
        // Crear el nuevo usuario
        val nuevoUsuario = Usuario(
            nombre = request.nombre,
            email = request.email.lowercase(),
            password = passwordEncoder.encode(request.password),
            rol = "ROLE_USER" // Rol por defecto
        )
        
        logger.info("Registrando nuevo usuario: ${request.email}")
        return usuarioRepository.save(nuevoUsuario)
    }
    
    /**
     * Busca un usuario por su email
     */
    fun buscarPorEmail(email: String): Usuario? {
        return usuarioRepository.findByEmail(email.lowercase())
    }
    
    /**
     * Busca un usuario por su ID
     */
    fun buscarPorId(id: Long): Usuario {
        return usuarioRepository.findById(id)
            .orElseThrow { EntityNotFoundException("Usuario no encontrado con ID: $id") }
    }
    
    /**
     * Actualiza la información de un usuario
     */
    @Transactional
    fun actualizarUsuario(id: Long, nombre: String): Usuario {
        val usuario = buscarPorId(id)
        usuario.nombre = nombre
        
        logger.info("Actualizando información del usuario ID: $id")
        return usuarioRepository.save(usuario)
    }
    
    /**
     * Cambia la contraseña de un usuario
     */
    @Transactional
    fun cambiarPassword(id: Long, passwordActual: String, nuevaPassword: String): Boolean {
        val usuario = buscarPorId(id)
        
        // Verificar que la contraseña actual sea correcta
        if (!passwordEncoder.matches(passwordActual, usuario.password)) {
            logger.warn("Intento de cambio de contraseña con credenciales incorrectas para usuario ID: $id")
            return false
        }
        
        // Actualizar la contraseña
        usuario.password = passwordEncoder.encode(nuevaPassword)
        usuarioRepository.save(usuario)
        
        logger.info("Contraseña actualizada para usuario ID: $id")
        return true
    }
} 