package com.documentos.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

/**
 * Filtro para validar tokens JWT en las solicitudes HTTP.
 * Establece la autenticación en el contexto de seguridad si el token es válido.
 */
@Component
class JwtAuthorizationFilter(
    private val jwtTokenProvider: JwtTokenProvider,
    private val userDetailsService: UserDetailsService
) : OncePerRequestFilter() {

    companion object {
        private val log = LoggerFactory.getLogger(JwtAuthorizationFilter::class.java)
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        try {
            extractAndValidateToken(request)
        } catch (e: Exception) {
            // Usar un mensaje de error genérico para evitar problemas de tipo
            log.error("Error de autenticación: {}", e.message)
            // No propagar la excepción para que la solicitud continúe
        }
        
        // Continuar con la cadena de filtros
        filterChain.doFilter(request, response)
    }
    
    /**
     * Extrae y valida el token JWT de la solicitud.
     * Si es válido, establece la autenticación en el contexto de seguridad.
     */
    private fun extractAndValidateToken(request: HttpServletRequest) {
        val token = getJwtFromRequest(request)
        
        if (token != null && jwtTokenProvider.validateToken(token)) {
            try {
                val username = jwtTokenProvider.getUsernameFromToken(token)
                val userDetails = userDetailsService.loadUserByUsername(username)
                
                val authentication = UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.authorities
                )
                
                SecurityContextHolder.getContext().authentication = authentication
                log.debug("Usuario autenticado: {}", username)
            } catch (e: Exception) {
                log.error("No se pudo autenticar al usuario: {}", e.message)
            }
        }
    }
    
    /**
     * Extrae el token JWT del encabezado Authorization
     */
    private fun getJwtFromRequest(request: HttpServletRequest): String? {
        val bearerToken = request.getHeader("Authorization")
        return when {
            bearerToken != null && bearerToken.startsWith("Bearer ") -> 
                bearerToken.substring(7)
            else -> null
        }
    }
} 