package com.documentos.security

import jakarta.servlet.FilterChain
import jakarta.servlet.ServletException
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletRequestWrapper
import jakarta.servlet.http.HttpServletResponse
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.io.IOException

/**
 * Filtro que aplica sanitización XSS a todos los parámetros y headers de las peticiones.
 * Se ejecuta temprano en la cadena de filtros para asegurar que el contenido esté sanitizado
 * antes de que otras partes de la aplicación lo procesen.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class XssFilter(private val xssSanitizer: XssSanitizer) : OncePerRequestFilter() {

    @Throws(ServletException::class, IOException::class)
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        // Envolver la petición con nuestro wrapper que sanitiza el contenido
        val wrappedRequest = XssRequestWrapper(request, xssSanitizer)
        
        // Configurar headers de seguridad para respuestas
        configureSecurityHeaders(response)
        
        // Continuar con la cadena de filtros
        filterChain.doFilter(wrappedRequest, response)
    }
    
    /**
     * Configura headers de seguridad estándar en la respuesta
     */
    private fun configureSecurityHeaders(response: HttpServletResponse) {
        // Prevenir XSS con Content-Security-Policy
        response.setHeader("Content-Security-Policy", 
            "default-src 'self'; script-src 'self'; " +
            "style-src 'self' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com; " +
            "img-src 'self' data: https://firebasestorage.googleapis.com; " +
            "connect-src 'self' https://firebasestorage.googleapis.com; " +
            "frame-src 'none'; object-src 'none'")
        
        // Prevenir clickjacking
        response.setHeader("X-Frame-Options", "DENY")
        
        // Prevenir MIME sniffing
        response.setHeader("X-Content-Type-Options", "nosniff")
        
        // Habilitar XSS protection en navegadores antiguos
        response.setHeader("X-XSS-Protection", "1; mode=block")
        
        // Controlar qué información se envía en los referers
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
        
        // Indicar que este sitio solo debe accederse por HTTPS (en producción)
        if (!isDevelopmentEnvironment()) {
            response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        }
    }
    
    /**
     * Determina si la aplicación está en entorno de desarrollo
     */
    private fun isDevelopmentEnvironment(): Boolean {
        val profiles = System.getProperty("spring.profiles.active", "")
        return profiles.contains("dev") || profiles.contains("development") || profiles.isEmpty()
    }
}

/**
 * Wrapper que sanitiza los parámetros y headers de la petición.
 */
class XssRequestWrapper(
    request: HttpServletRequest,
    private val xssSanitizer: XssSanitizer
) : HttpServletRequestWrapper(request) {

    /**
     * Sanitiza el valor de un parámetro
     */
    override fun getParameter(name: String): String? {
        val value = super.getParameter(name)
        return xssSanitizer.sanitize(value)
    }

    /**
     * Sanitiza los valores de un parámetro (para parámetros con múltiples valores)
     */
    override fun getParameterValues(name: String): Array<String>? {
        val values = super.getParameterValues(name) ?: return null
        return values.map { xssSanitizer.sanitize(it) ?: "" }.toTypedArray()
    }

    /**
     * Sanitiza los headers
     */
    override fun getHeader(name: String): String? {
        val value = super.getHeader(name)
        
        // No sanitizar headers de autenticación y algunos otros específicos
        return if (HEADERS_TO_EXCLUDE.contains(name.lowercase())) {
            value
        } else {
            xssSanitizer.sanitize(value)
        }
    }

    companion object {
        // Headers que no deben ser sanitizados
        private val HEADERS_TO_EXCLUDE = setOf(
            "authorization", 
            "content-type", 
            "content-length", 
            "user-agent", 
            "host", 
            "connection", 
            "accept-encoding", 
            "accept-language"
        )
    }
} 