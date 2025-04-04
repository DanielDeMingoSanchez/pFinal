package com.documentos.repository

import com.documentos.model.Documento
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface DocumentoRepository : JpaRepository<Documento, Long> {
    fun findByUsuarioId(usuarioId: Long): List<Documento>
    fun findByEstado(estado: String): List<Documento>
} 