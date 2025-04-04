package com.documentos.security

import com.documentos.model.Usuario
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails

class UserDetailsImpl(private val usuario: Usuario) : UserDetails {
    
    override fun getAuthorities(): Collection<GrantedAuthority> {
        return listOf(SimpleGrantedAuthority(usuario.rol))
    }
    
    override fun getPassword(): String {
        return usuario.password
    }
    
    override fun getUsername(): String {
        return usuario.email
    }
    
    fun getId(): Long {
        return usuario.id
    }
    
    fun getNombre(): String {
        return usuario.nombre
    }
    
    override fun isAccountNonExpired(): Boolean {
        return true
    }
    
    override fun isAccountNonLocked(): Boolean {
        return usuario.activo
    }
    
    override fun isCredentialsNonExpired(): Boolean {
        return true
    }
    
    override fun isEnabled(): Boolean {
        return usuario.activo
    }
} 