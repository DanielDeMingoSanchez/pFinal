package com.documentos.model

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "documentos")
data class Documento(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    val nombre: String,
    
    val url: String,
    
    val tipo: String,
    
    val fechaSubida: LocalDateTime = LocalDateTime.now(),
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    val usuario: Usuario,
    
    val estado: String = "ACTIVO"
) 