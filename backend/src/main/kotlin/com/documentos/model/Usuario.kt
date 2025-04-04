package com.documentos.model

import jakarta.persistence.*

@Entity
@Table(name = "usuarios")
data class Usuario(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @Column(nullable = false)
    var nombre: String,
    
    @Column(nullable = false, unique = true)
    val email: String,
    
    @Column(nullable = false)
    var password: String,
    
    @Column(nullable = false)
    val rol: String = "ROLE_USER",
    
    @Column(name = "activo")
    val activo: Boolean = true
) 