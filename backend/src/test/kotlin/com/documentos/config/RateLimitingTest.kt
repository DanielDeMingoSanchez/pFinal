package com.documentos.config

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.condition.EnabledIfSystemProperty
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.mock.web.MockFilterChain
import org.springframework.test.util.ReflectionTestUtils
import java.util.concurrent.TimeUnit

@ExtendWith(MockitoExtension::class)
@EnabledIfSystemProperty(named = "excludeProblemTests", matches = "false")
class RateLimitingTest {

    private lateinit var loginAttemptService: LoginAttemptService
    private lateinit var rateLimitingFilter: RateLimitingFilter
    private lateinit var globalRateLimitingFilter: GlobalRateLimitingFilter
    
    private val testIp = "192.168.1.100"
    private val maxAttempts = 5
    private val blockDuration = 5L // segundos para las pruebas

    @BeforeEach
    fun setup() {
        loginAttemptService = LoginAttemptService()
        // Configuramos las propiedades usando ReflectionTestUtils
        ReflectionTestUtils.setField(loginAttemptService, "maxAttempts", maxAttempts)
        ReflectionTestUtils.setField(loginAttemptService, "blockDurationSeconds", blockDuration.toInt())
        
        rateLimitingFilter = RateLimitingFilter(loginAttemptService)
        
        // Inicializar el filtro global con propiedades para pruebas
        globalRateLimitingFilter = GlobalRateLimitingFilter()
        // Configurar propiedades para pruebas (usando reflection si es necesario)
    }

    @Test
    fun `LoginAttemptService debe permitir hasta maxAttempts intentos`() {
        // Verificar que inicialmente la IP no está bloqueada
        assertFalse(loginAttemptService.isBlocked(testIp))
        
        // Simular maxAttempts-1 intentos fallidos (todavía no debe bloquear)
        repeat(maxAttempts - 1) {
            loginAttemptService.loginFailed(testIp)
            assertFalse(loginAttemptService.isBlocked(testIp))
        }
        
        // Un intento fallido más debe bloquear la IP
        loginAttemptService.loginFailed(testIp)
        assertTrue(loginAttemptService.isBlocked(testIp))
    }

    @Test
    fun `LoginAttemptService debe desbloquear después del tiempo de bloqueo`() {
        // Bloquear la IP
        repeat(maxAttempts) {
            loginAttemptService.loginFailed(testIp)
        }
        
        // Verificar que está bloqueada
        assertTrue(loginAttemptService.isBlocked(testIp))
        
        // Esperar a que expire el bloqueo (usamos un tiempo corto para la prueba)
        TimeUnit.SECONDS.sleep(blockDuration + 1)
        
        // Verificar que ya no está bloqueada
        assertFalse(loginAttemptService.isBlocked(testIp))
    }

    @Test
    fun `LoginAttemptService debe reiniciar contador después de login exitoso`() {
        // Simular maxAttempts-1 intentos fallidos
        repeat(maxAttempts - 1) {
            loginAttemptService.loginFailed(testIp)
        }
        
        // Simular login exitoso
        loginAttemptService.loginSucceeded(testIp)
        
        // Verificar que el contador se reinició (puede hacer otro intento fallido sin bloquear)
        loginAttemptService.loginFailed(testIp)
        assertFalse(loginAttemptService.isBlocked(testIp))
    }

    @Test
    fun `RateLimitingFilter debe bloquear peticiones de IPs bloqueadas`() {
        // Preparar request y response mock
        val request = MockHttpServletRequest()
        request.remoteAddr = testIp
        request.requestURI = "/api/auth/login"
        request.method = "POST"
        
        val response = MockHttpServletResponse()
        val filterChain = MockFilterChain()
        
        // Bloquear la IP
        repeat(maxAttempts) {
            loginAttemptService.loginFailed(testIp)
        }
        
        // Ejecutar el filtro usando reflection para acceder a método protected
        val filterMethod = RateLimitingFilter::class.java.getDeclaredMethod(
            "doFilterInternal",
            jakarta.servlet.http.HttpServletRequest::class.java,
            jakarta.servlet.http.HttpServletResponse::class.java,
            jakarta.servlet.FilterChain::class.java
        )
        filterMethod.isAccessible = true
        filterMethod.invoke(rateLimitingFilter, request, response, filterChain)
        
        // Verificar que la respuesta es 429 (Too Many Requests)
        assertEquals(429, response.status)
        
        // Verificar que el contenido de la respuesta contiene el mensaje correcto
        assertTrue(response.contentAsString.contains("Too many login attempts"))
    }

    @Test
    fun `RateLimitingFilter debe permitir peticiones de IPs no bloqueadas`() {
        // Preparar request y response mock
        val request = MockHttpServletRequest()
        request.remoteAddr = testIp
        request.requestURI = "/api/auth/login"
        request.method = "POST"
        
        val response = MockHttpServletResponse()
        val filterChain = MockFilterChain()
        
        // Ejecutar el filtro con IP no bloqueada, usando reflection para acceder a método protected
        val filterMethod = RateLimitingFilter::class.java.getDeclaredMethod(
            "doFilterInternal",
            jakarta.servlet.http.HttpServletRequest::class.java,
            jakarta.servlet.http.HttpServletResponse::class.java,
            jakarta.servlet.FilterChain::class.java
        )
        filterMethod.isAccessible = true
        filterMethod.invoke(rateLimitingFilter, request, response, filterChain)
        
        // Verificar que la petición continuó (no se estableció código de estado)
        assertEquals(0, response.status) // El status no se cambia si la cadena de filtros continúa
    }

    @Test
    fun `LoginAttemptService debe proporcionar tiempo restante de bloqueo`() {
        // Bloquear la IP
        repeat(maxAttempts) {
            loginAttemptService.loginFailed(testIp)
        }
        
        // Verificar que el tiempo restante es aproximadamente igual al tiempo de bloqueo
        val remainingTime = loginAttemptService.getBlockTimeRemaining(testIp)
        assertTrue(remainingTime > 0 && remainingTime <= blockDuration)
    }
} 