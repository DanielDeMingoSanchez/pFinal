package com.documentos.config

import com.github.benmanes.caffeine.cache.Caffeine
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

/**
 * Filtro global que limita la tasa de peticiones por IP para todas las peticiones.
 * Esto ayuda a prevenir ataques de fuerza bruta, DDoS y otros tipos de abuso.
 */
@Component
class GlobalRateLimitingFilter : OncePerRequestFilter() {

    @Value("\${rate.limit.enabled:true}")
    private val enabled: Boolean = true

    @Value("\${rate.limit.requests-per-second:10}")
    private val requestsPerSecond: Int = 10

    @Value("\${rate.limit.burst:20}")
    private val burst: Int = 20

    // Cache para almacenar los contadores de peticiones por IP
    private val requestCounts = Caffeine.newBuilder()
        .expireAfterWrite(1, TimeUnit.MINUTES)
        .build<String, AtomicInteger>()

    // Mapeo de IPs bloqueadas temporalmente
    private val blockedIPs = ConcurrentHashMap<String, Long>()

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        // Bypass si el rate limiting está desactivado
        if (!enabled) {
            filterChain.doFilter(request, response)
            return
        }

        val ip = getClientIP(request)
        
        // Verificar si la IP está bloqueada
        val blockedUntil = blockedIPs[ip]
        if (blockedUntil != null) {
            if (System.currentTimeMillis() > blockedUntil) {
                // El bloqueo ha expirado
                blockedIPs.remove(ip)
            } else {
                // Todavía bloqueado
                val remainingSeconds = (blockedUntil - System.currentTimeMillis()) / 1000
                response.status = HttpStatus.TOO_MANY_REQUESTS.value()
                response.contentType = "application/json"
                response.writer.write("""
                    {
                        "error": "Rate limit exceeded",
                        "message": "Ha excedido el límite de peticiones por minuto. Por favor, intente nuevamente después de $remainingSeconds segundos.",
                        "remainingSeconds": $remainingSeconds
                    }
                """.trimIndent())
                return
            }
        }

        // Incrementar contador para esta IP
        val counter = requestCounts.get(ip) { AtomicInteger(0) }
        val requestCount = counter.incrementAndGet()
        
        // Verificar si excede el límite
        if (requestCount > burst) {
            // Bloquear la IP por 30 segundos
            blockedIPs[ip] = System.currentTimeMillis() + 30000
            
            response.status = HttpStatus.TOO_MANY_REQUESTS.value()
            response.contentType = "application/json"
            response.writer.write("""
                {
                    "error": "Rate limit exceeded",
                    "message": "Ha excedido el límite de peticiones por minuto. Por favor, intente nuevamente después de 30 segundos.",
                    "remainingSeconds": 30
                }
            """.trimIndent())
            return
        }
        
        // Agregar headers de rate limiting
        response.addHeader("X-RateLimit-Limit", burst.toString())
        response.addHeader("X-RateLimit-Remaining", (burst - requestCount).toString())
        
        // Continuar con la petición
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