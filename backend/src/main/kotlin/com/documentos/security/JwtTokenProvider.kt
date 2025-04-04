package com.documentos.security

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Component
import java.util.Date
import javax.crypto.SecretKey

@Component
class JwtTokenProvider {
    
    @Value("\${app.jwt.secret}")
    private lateinit var jwtSecret: String
    
    @Value("\${app.jwt.expiration-ms}")
    private var jwtExpirationMs: Long = 86400000 // 24 horas por defecto
    
    /**
     * Genera un token JWT a partir de la autenticación
     */
    fun generateToken(authentication: Authentication): String {
        val userPrincipal = authentication.principal as UserDetailsImpl
        
        val now = Date()
        val expiryDate = Date(now.time + jwtExpirationMs)
        
        // Generar la clave secretaa partir del string
        val key: SecretKey = Keys.hmacShaKeyFor(jwtSecret.toByteArray())
        
        return Jwts.builder()
            .setSubject(userPrincipal.username)
            .claim("id", userPrincipal.getId())
            .claim("roles", userPrincipal.authorities.map { it.authority })
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(key, SignatureAlgorithm.HS512)
            .compact()
    }
    
    /**
     * Extrae el username del token JWT
     */
    fun getUsernameFromToken(token: String): String {
        val key: SecretKey = Keys.hmacShaKeyFor(jwtSecret.toByteArray())
        
        val claims = Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .body
            
        return claims.subject
    }
    
    /**
     * Valida el token JWT
     */
    fun validateToken(token: String): Boolean {
        try {
            val key: SecretKey = Keys.hmacShaKeyFor(jwtSecret.toByteArray())
            
            Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                
            return true
        } catch (e: Exception) {
            return false
        }
    }
} 