package com.documentos.config

import com.github.benmanes.caffeine.cache.Cache
import com.github.benmanes.caffeine.cache.Caffeine
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.util.concurrent.TimeUnit

@Service
class LoginAttemptService {
    
    @Value("\${login.attempt.max-attempts:5}")
    private var maxAttempts: Int = 5
    
    @Value("\${login.attempt.block-duration:300}")
    private var blockDurationSeconds: Int = 300
    
    // Cache para mantener el recuento de intentos fallidos por IP
    private val attemptCache: Cache<String, Int> = Caffeine.newBuilder()
        .expireAfterWrite(blockDurationSeconds.toLong(), TimeUnit.SECONDS)
        .build()
    
    // Cache para mantener las IPs bloqueadas con sus tiempos de expiración
    private val blockedCache: Cache<String, Long> = Caffeine.newBuilder()
        .expireAfterWrite(blockDurationSeconds.toLong(), TimeUnit.SECONDS)
        .build()
    
    /**
     * Registra un intento fallido de login para una IP
     */
    fun loginFailed(ip: String) {
        val attempts = attemptCache.getIfPresent(ip) ?: 0
        attemptCache.put(ip, attempts + 1)
        
        // Si se excede el máximo de intentos, bloquear la IP
        if (attempts + 1 >= maxAttempts) {
            blockedCache.put(ip, System.currentTimeMillis() + (blockDurationSeconds * 1000))
        }
    }
    
    /**
     * Registra un intento exitoso de login para una IP
     */
    fun loginSucceeded(ip: String) {
        // Limpiar el cache para esta IP
        attemptCache.invalidate(ip)
        blockedCache.invalidate(ip)
    }
    
    /**
     * Verifica si una IP está bloqueada
     */
    fun isBlocked(ip: String): Boolean {
        val blockExpiry = blockedCache.getIfPresent(ip) ?: return false
        return blockExpiry > System.currentTimeMillis()
    }
    
    /**
     * Obtiene el tiempo restante de bloqueo en segundos
     */
    fun getBlockTimeRemaining(ip: String): Long {
        val blockExpiry = blockedCache.getIfPresent(ip) ?: return 0
        val remainingMs = blockExpiry - System.currentTimeMillis()
        return if (remainingMs > 0) remainingMs / 1000 else 0
    }
    
    /**
     * Obtiene el número de intentos fallidos para una IP
     */
    fun getAttempts(ip: String): Int {
        return attemptCache.getIfPresent(ip) ?: 0
    }
} 