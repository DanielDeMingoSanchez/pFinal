package com.documentos.config

import com.github.benmanes.caffeine.cache.Caffeine
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.time.Duration
import java.util.concurrent.TimeUnit
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse

/**
 * Configuración para limitar la cantidad de solicitudes por IP
 * para evitar ataques de fuerza bruta.
 */
@Configuration
class RateLimitingConfig {
    // No necesita definir nada aquí, usaremos la clase LoginAttemptService que ya tenemos
}

/**
 * Filtro que aplica el rate limiting a todas las solicitudes de inicio de sesión
 */
@Component
class RateLimitingFilter(private val loginAttemptService: com.documentos.config.LoginAttemptService) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val ip = getClientIP(request)
        
        // Solo aplica rate limiting a las rutas de autenticación
        if (request.requestURI.endsWith("/login") && request.method == "POST") {
            if (loginAttemptService.isBlocked(ip)) {
                val remainingSeconds = loginAttemptService.getBlockTimeRemaining(ip)
                response.status = HttpStatus.TOO_MANY_REQUESTS.value()
                response.contentType = "application/json"
                response.writer.write("""
                    {
                        "error": "Too many login attempts",
                        "message": "Su dirección IP ha sido bloqueada temporalmente debido a múltiples intentos fallidos de inicio de sesión. Por favor, intente nuevamente después de ${remainingSeconds} segundos.",
                        "remainingSeconds": ${remainingSeconds}
                    }
                """.trimIndent())
                return
            }
        }
        
        filterChain.doFilter(request, response)
    }
    
    /**
     * Obtiene la IP real del cliente, considerando posibles proxies
     */
    private fun getClientIP(request: HttpServletRequest): String {
        val xfHeader = request.getHeader("X-Forwarded-For")
        return when {
            xfHeader != null -> xfHeader.split(",")[0].trim()
            else -> request.remoteAddr
        }
    }
} 