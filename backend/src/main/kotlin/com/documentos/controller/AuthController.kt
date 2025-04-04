package com.documentos.controller

import com.documentos.config.LoginAttemptService
import com.documentos.dto.LoginRequest
import com.documentos.dto.RegistroRequest
import com.documentos.dto.AuthResponse
import com.documentos.security.JwtTokenProvider
import com.documentos.service.UsuarioService
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Controlador para gestionar el registro e inicio de sesión de usuarios.
 * Incluye rate limiting para prevenir ataques de fuerza bruta.
 */
@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authenticationManager: AuthenticationManager,
    private val jwtTokenProvider: JwtTokenProvider,
    private val usuarioService: UsuarioService,
    private val loginAttemptService: LoginAttemptService
) {
    private val logger = LoggerFactory.getLogger(AuthController::class.java)

    /**
     * Endpoint para el inicio de sesión
     */
    @PostMapping("/login")
    fun login(
        @Valid @RequestBody loginRequest: LoginRequest,
        request: HttpServletRequest
    ): ResponseEntity<Any> {
        val ip = getClientIP(request)
        
        // Verificar si la IP está bloqueada
        if (loginAttemptService.isBlocked(ip)) {
            val remainingSeconds = loginAttemptService.getBlockTimeRemaining(ip)
            logger.warn("Intento de inicio de sesión desde IP bloqueada: $ip")
            
            return ResponseEntity
                .status(HttpStatus.TOO_MANY_REQUESTS)
                .body(mapOf(
                    "error" to "Too many login attempts",
                    "message" to "Su dirección IP ha sido bloqueada temporalmente debido a múltiples intentos fallidos de inicio de sesión. Por favor, intente nuevamente después de $remainingSeconds segundos.",
                    "remainingSeconds" to remainingSeconds
                ))
        }
        
        return try {
            // Autenticar usuario
            val authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken(
                    loginRequest.email,
                    loginRequest.password
                )
            )
            
            // Generar token JWT
            val jwt = jwtTokenProvider.generateToken(authentication)
            
            // Registrar inicio de sesión exitoso
            loginAttemptService.loginSucceeded(ip)
            logger.info("Inicio de sesión exitoso para el usuario: ${loginRequest.email}")
            
            ResponseEntity.ok(AuthResponse(token = jwt))
        } catch (e: BadCredentialsException) {
            // Registrar intento fallido
            loginAttemptService.loginFailed(ip)
            logger.warn("Intento de inicio de sesión fallido para el usuario: ${loginRequest.email} desde IP: $ip")
            
            ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(mapOf(
                    "error" to "Unauthorized",
                    "message" to "Credenciales inválidas"
                ))
        }
    }

    /**
     * Endpoint para el registro de usuarios
     */
    @PostMapping("/registro")
    fun registro(@Valid @RequestBody registroRequest: RegistroRequest): ResponseEntity<Any> {
        return try {
            // Verificar si el correo ya está registrado
            if (usuarioService.existsByEmail(registroRequest.email)) {
                return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(mapOf(
                        "error" to "Bad Request",
                        "message" to "El correo electrónico ya está registrado"
                    ))
            }
            
            // Registrar nuevo usuario
            usuarioService.registrarUsuario(registroRequest)
            logger.info("Usuario registrado exitosamente: ${registroRequest.email}")
            
            ResponseEntity
                .status(HttpStatus.CREATED)
                .body(mapOf("message" to "Usuario registrado exitosamente"))
        } catch (e: Exception) {
            logger.error("Error al registrar usuario: ${registroRequest.email}", e)
            
            ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf(
                    "error" to "Internal Server Error",
                    "message" to "Error al registrar usuario"
                ))
        }
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