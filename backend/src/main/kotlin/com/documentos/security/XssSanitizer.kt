package com.documentos.security

import org.owasp.html.PolicyFactory
import org.owasp.html.Sanitizers
import org.springframework.stereotype.Component

/**
 * Componente para sanitizar entradas de usuario y prevenir ataques XSS (Cross-Site Scripting).
 * Utiliza la librería OWASP HTML Sanitizer para eliminar código malicioso.
 */
@Component
class XssSanitizer {
    
    // Combinar varias políticas de sanitización
    private val policy: PolicyFactory = Sanitizers.BLOCKS
        .and(Sanitizers.FORMATTING)
        .and(Sanitizers.LINKS)
        .and(Sanitizers.STYLES)
        .and(Sanitizers.IMAGES)
        .and(Sanitizers.TABLES)
    
    /**
     * Sanitiza una cadena de texto para prevenir ataques XSS.
     * 
     * @param input La cadena de texto a sanitizar
     * @return La cadena sanitizada, segura para mostrar en HTML
     */
    fun sanitize(input: String?): String? {
        if (input == null || input.isEmpty()) {
            return input
        }
        
        // Aplicar la política de sanitización
        return policy.sanitize(input)
    }
    
    /**
     * Sanitiza un mapa de valores para prevenir ataques XSS.
     * 
     * @param map El mapa a sanitizar
     * @return El mapa con todos sus valores String sanitizados
     */
    fun sanitize(map: Map<String, Any?>?): Map<String, Any?>? {
        if (map == null || map.isEmpty()) {
            return map
        }
        
        return map.mapValues { (_, value) ->
            when (value) {
                is String -> sanitize(value)
                is Map<*, *> -> sanitize(value as? Map<String, Any?>)
                is List<*> -> sanitize(value)
                else -> value
            }
        }
    }
    
    /**
     * Sanitiza una lista de valores para prevenir ataques XSS.
     * 
     * @param list La lista a sanitizar
     * @return La lista con todos sus valores String sanitizados
     */
    fun sanitize(list: List<Any?>?): List<Any?>? {
        if (list == null || list.isEmpty()) {
            return list
        }
        
        return list.map { item ->
            when (item) {
                is String -> sanitize(item)
                is Map<*, *> -> sanitize(item as? Map<String, Any?>)
                is List<*> -> sanitize(item)
                else -> item
            }
        }
    }
} 