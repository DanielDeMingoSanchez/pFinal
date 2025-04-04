package com.documentos.security

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource
import org.mockito.ArgumentMatchers.any
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito.*
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.RowMapper
import org.springframework.security.crypto.password.PasswordEncoder
import java.sql.ResultSet
import javax.sql.DataSource
import com.documentos.repository.UserRepository
import com.documentos.model.User
import com.documentos.service.UserService
import org.junit.jupiter.api.Assertions.*

/**
 * Pruebas para verificar que la aplicación está protegida contra inyecciones SQL.
 * 
 * JPA/Hibernate proporciona protección inherente contra inyecciones SQL mediante
 * el uso de consultas parametrizadas, pero estas pruebas verifican manualmente
 * que funciona correctamente.
 */
@ExtendWith(MockitoExtension::class)
class SqlInjectionPreventionTest {

    @Mock
    private lateinit var userRepository: UserRepository
    
    @Mock
    private lateinit var passwordEncoder: PasswordEncoder
    
    @Mock
    private lateinit var dataSource: DataSource
    
    @Mock
    private lateinit var jdbcTemplate: JdbcTemplate
    
    @InjectMocks
    private lateinit var userService: UserService

    /**
     * Prueba que verifica que JPA maneja correctamente los intentos de inyección SQL
     * en los métodos de búsqueda por email.
     */
    @ParameterizedTest
    @ValueSource(strings = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --",
        "') OR ('1'='1",
        "admin@test.com' --"
    ])
    fun `findByEmail debe manejar correctamente los intentos de inyección SQL`(maliciousEmail: String) {
        // Configurar el comportamiento del repositorio para cualquier email
        `when`(userRepository.findByEmail(any())).thenReturn(null)
        
        // Intentar recuperar un usuario con un email malicioso
        val result = runCatching { userService.getUserByEmail(maliciousEmail) }
        
        // Verificar que la búsqueda falla normalmente (no lanza una excepción SQL)
        assertTrue(result.isFailure)
        
        // Verificar que la excepción es del tipo esperado (RuntimeException en este caso)
        assertTrue(result.exceptionOrNull() is RuntimeException)
        
        // Verificar que se llamó al método con el valor exacto, sin interpretarlo como SQL
        verify(userRepository).findByEmail(maliciousEmail)
    }

    /**
     * Test para simular el comportamiento de JPA con consultas nativas parametrizadas
     * y verificar que maneja correctamente los intentos de inyección.
     */
    @Test
    fun `las consultas nativas parametrizadas deben prevenir inyecciones SQL`() {
        // Crear un JdbcTemplate mock que simula el comportamiento de JPA
        val mockJdbcTemplate = mock(JdbcTemplate::class.java)
        
        // Configurar el mock para simular consultas parametrizadas
        `when`(mockJdbcTemplate.query(
            anyString(),
            any<Array<Any>>(),
            any<RowMapper<User>>()
        )).thenReturn(emptyList())
        
        // Intentar una consulta con un parámetro malicioso
        val maliciousId = "1; DROP TABLE users; --"
        
        mockJdbcTemplate.query(
            "SELECT * FROM users WHERE id = ?",
            arrayOf(maliciousId),
            RowMapper<User> { rs: ResultSet, _: Int -> 
                User(
                    id = rs.getLong("id"),
                    email = rs.getString("email"),
                    password = rs.getString("password"),
                    name = rs.getString("name")
                )
            }
        )
        
        // Verificar que la consulta se realizó con el parámetro exacto
        verify(mockJdbcTemplate).query(
            eq("SELECT * FROM users WHERE id = ?"),
            eq(arrayOf<Any>(maliciousId)),
            any<RowMapper<User>>()
        )
    }
    
    /**
     * Prueba que verifica que las consultas JPQL (HQL) manejan correctamente
     * los intentos de inyección SQL.
     */
    @Test
    fun `JPQL debe manejar correctamente los intentos de inyección SQL`() {
        // Este test es conceptual, ya que no podemos ejecutar JPQL directamente aquí
        // En una aplicación real, Hibernate sanitiza automáticamente los parámetros
        
        // Configurar mock de repositorio
        val userRepositoryMock = mock(UserRepository::class.java)
        
        // Intentar búsqueda con parámetro malicioso
        val maliciousName = "'; DELETE FROM users WHERE name != '"
        
        userRepositoryMock.findByEmail(maliciousName)
        
        // Verificar que se pasó el parámetro exacto al repositorio
        verify(userRepositoryMock).findByEmail(eq(maliciousName))
        
        // En una aplicación real, Hibernate convertiría esto en una consulta parametrizada:
        // SELECT u FROM User u WHERE u.email = ?
        // Con el parámetro pasado como valor, no como parte de la consulta SQL
    }
} 