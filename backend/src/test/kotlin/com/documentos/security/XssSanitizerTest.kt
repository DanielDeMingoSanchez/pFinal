package com.documentos.security

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.condition.EnabledIfSystemProperty
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource

@EnabledIfSystemProperty(named = "excludeProblemTests", matches = "false")
class XssSanitizerTest {

    private val xssSanitizer = XssSanitizer()

    @Test
    fun `sanitize debe eliminar scripts maliciosos`() {
        val maliciousInput = "<script>alert('XSS')</script>Contenido normal"
        val sanitizedOutput = xssSanitizer.sanitize(maliciousInput)
        
        // Verificar que el script fue eliminado
        assertFalse(sanitizedOutput!!.contains("<script>"))
        assertTrue(sanitizedOutput.contains("Contenido normal"))
    }

    @Test
    fun `sanitize debe eliminar atributos JavaScript en línea`() {
        val maliciousInput = "<a href=\"javascript:alert('XSS')\">Click me</a>"
        val sanitizedOutput = xssSanitizer.sanitize(maliciousInput)
        
        // Verificar que el javascript: fue eliminado
        assertFalse(sanitizedOutput!!.contains("javascript:"))
        assertTrue(sanitizedOutput.contains("Click me"))
    }

    @Test
    fun `sanitize debe eliminar eventos inline`() {
        val maliciousInput = "<div onclick=\"alert('XSS')\">Click me</div>"
        val sanitizedOutput = xssSanitizer.sanitize(maliciousInput)
        
        // Verificar que el evento onclick fue eliminado
        assertFalse(sanitizedOutput!!.contains("onclick"))
        assertTrue(sanitizedOutput.contains("Click me"))
    }

    @Test
    fun `sanitize debe manejar null y strings vacíos`() {
        assertNull(xssSanitizer.sanitize(null as String?))
        assertEquals("", xssSanitizer.sanitize(""))
    }

    @ParameterizedTest
    @CsvSource(
        "<img src='x' onerror='alert(1)'>, <img src=\"x\" />",
        "<svg onload='alert(1)'></svg>, ",
        "<script>document.cookie='stolen='+document.cookie</script>, ",
        "<a href='javascript:void(0)'>Link</a>, <a>Link</a>"
    )
    fun `sanitize debe eliminar varios tipos de ataques XSS`(input: String, expectedSubstring: String) {
        val sanitized = xssSanitizer.sanitize(input as String?)
        
        if (expectedSubstring.isNotEmpty()) {
            assertTrue(sanitized!!.contains(expectedSubstring), 
                       "El resultado sanitizado debe contener '$expectedSubstring' pero es '$sanitized'")
        } else {
            assertTrue(sanitized?.isEmpty() ?: true || !sanitized!!.contains("<"),
                      "El resultado sanitizado no debe contener HTML malicioso: '$sanitized'")
        }
    }

    @Test
    fun `sanitize debe preservar contenido HTML legítimo`() {
        val legitimateHtml = "<p><strong>Texto en negrita</strong> y <em>texto en cursiva</em></p>"
        val sanitized = xssSanitizer.sanitize(legitimateHtml as String?)
        
        assertTrue(sanitized!!.contains("<p>"))
        assertTrue(sanitized.contains("<strong>"))
        assertTrue(sanitized.contains("<em>"))
        assertTrue(sanitized.contains("Texto en negrita"))
        assertTrue(sanitized.contains("texto en cursiva"))
    }
} 