package com.documentos.controller

import com.documentos.config.LoginAttemptService
import com.documentos.dto.LoginRequest
import com.documentos.dto.RegistroRequest
import com.documentos.security.JwtTokenProvider
import com.documentos.service.UsuarioService
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.condition.EnabledIfSystemProperty
import org.mockito.Mockito.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.http.MediaType
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import jakarta.servlet.http.HttpServletRequest

@WebMvcTest(AuthController::class)
@EnabledIfSystemProperty(named = "excludeProblemTests", matches = "false")
class AuthControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var usuarioService: UsuarioService

    @MockBean
    private lateinit var loginAttemptService: LoginAttemptService
    
    @MockBean
    private lateinit var authenticationManager: AuthenticationManager
    
    @MockBean
    private lateinit var jwtTokenProvider: JwtTokenProvider

    @Test
    fun `login con credenciales válidas debe devolver token`() {
        // Preparación
        val loginRequest = LoginRequest(email = "usuario@ejemplo.com", password = "password123")
        val expectedToken = "jwt-token-example"
        val authentication = mock(Authentication::class.java)

        `when`(authenticationManager.authenticate(any())).thenReturn(authentication)
        `when`(jwtTokenProvider.generateToken(authentication)).thenReturn(expectedToken)
        `when`(loginAttemptService.isBlocked(anyString())).thenReturn(false)

        // Ejecución y verificación
        mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.token").value(expectedToken))

        verify(loginAttemptService).loginSucceeded(anyString())
    }

    @Test
    fun `login con credenciales inválidas debe devolver error y registrar intento fallido`() {
        // Preparación
        val loginRequest = LoginRequest(email = "usuario@ejemplo.com", password = "wrongpassword")

        `when`(authenticationManager.authenticate(any())).thenThrow(BadCredentialsException("Credenciales inválidas"))
        `when`(loginAttemptService.isBlocked(anyString())).thenReturn(false)

        // Ejecución y verificación
        mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest))
        )
            .andExpect(status().isUnauthorized)
            .andExpect(jsonPath("$.error").value("Unauthorized"))

        verify(loginAttemptService).loginFailed(anyString())
    }

    @Test
    fun `login con IP bloqueada debe devolver error 429`() {
        // Preparación
        val loginRequest = LoginRequest(email = "usuario@ejemplo.com", password = "password123")
        
        `when`(loginAttemptService.isBlocked(anyString())).thenReturn(true)
        `when`(loginAttemptService.getBlockTimeRemaining(anyString())).thenReturn(299L)

        // Ejecución y verificación
        mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest))
        )
            .andExpect(status().isTooManyRequests)
            .andExpect(jsonPath("$.error").value("Too many login attempts"))
            .andExpect(jsonPath("$.remainingSeconds").value(299))

        verify(authenticationManager, never()).authenticate(any())
    }

    @Test
    fun `registro con datos válidos debe devolver éxito`() {
        // Preparación
        val registroRequest = RegistroRequest(
            nombre = "Usuario Test",
            email = "test@ejemplo.com", 
            password = "password123"
        )

        `when`(usuarioService.existsByEmail(anyString())).thenReturn(false)
        doNothing().`when`(usuarioService).registrarUsuario(any())

        // Ejecución y verificación
        mockMvc.perform(
            post("/api/auth/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registroRequest))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.message").value("Usuario registrado exitosamente"))
    }

    @Test
    fun `registro con email existente debe devolver error`() {
        // Preparación
        val registroRequest = RegistroRequest(
            nombre = "Usuario Test",
            email = "existente@ejemplo.com", 
            password = "password123"
        )
        
        `when`(usuarioService.existsByEmail(anyString())).thenReturn(true)

        // Ejecución y verificación
        mockMvc.perform(
            post("/api/auth/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registroRequest))
        )
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.error").value("Bad Request"))
    }
} 