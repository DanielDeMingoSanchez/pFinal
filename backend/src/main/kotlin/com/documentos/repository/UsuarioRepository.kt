package com.documentos.repository

import com.documentos.model.Usuario
import org.springframework.stereotype.Repository

@Repository
interface UsuarioRepository {
    fun findByEmail(email: String): Usuario?
    fun existsByEmail(email: String): Boolean
    fun findById(id: Long): java.util.Optional<Usuario>
    fun save(usuario: Usuario): Usuario
    fun findAll(): List<Usuario>
    fun deleteById(id: Long)
} 