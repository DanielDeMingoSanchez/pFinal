package com.documentos.repository

import com.documentos.model.Usuario
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.concurrent.CompletableFuture
import java.util.concurrent.ConcurrentHashMap
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Primary
import java.util.concurrent.atomic.AtomicLong
import kotlin.collections.HashMap

@Repository
@Primary
class FirebaseUsuarioRepository(
    @Value("\${firebase.database.url}")
    private val firebaseDatabaseUrl: String
) : UsuarioRepository {
    
    private val logger = LoggerFactory.getLogger(FirebaseUsuarioRepository::class.java)
    private val usuariosRef = FirebaseDatabase.getInstance(firebaseDatabaseUrl).getReference("usuarios")
    private val idCounter = AtomicLong(1) // Para generar IDs en caso de que no existan
    private val emailIndex = ConcurrentHashMap<String, Long>() // Índice para búsqueda por email
    
    init {
        // Inicializar el índice de emails cuando se carga la clase
        initializeEmailIndex()
    }
    
    /**
     * Inicializa el índice de emails para búsquedas rápidas
     */
    private fun initializeEmailIndex() {
        usuariosRef.addListenerForSingleValueEvent(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                emailIndex.clear()
                snapshot.children.forEach { child ->
                    val usuario = child.getValue(Usuario::class.java)
                    if (usuario != null) {
                        emailIndex[usuario.email.lowercase()] = usuario.id
                        if (usuario.id >= idCounter.get()) {
                            idCounter.set(usuario.id + 1)
                        }
                    }
                }
                logger.info("Índice de emails inicializado con ${emailIndex.size} usuarios")
            }
            
            override fun onCancelled(error: DatabaseError) {
                logger.error("Error inicializando índice de emails: ${error.message}")
            }
        })
    }
    
    override fun findByEmail(email: String): Usuario? {
        val userId = emailIndex[email.lowercase()] ?: return null
        return findById(userId).orElse(null)
    }
    
    override fun existsByEmail(email: String): Boolean {
        return emailIndex.containsKey(email.lowercase())
    }
    
    override fun findById(id: Long): Optional<Usuario> {
        val future = CompletableFuture<Optional<Usuario>>()
        
        usuariosRef.child(id.toString()).addListenerForSingleValueEvent(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val usuario = snapshot.getValue(Usuario::class.java)
                future.complete(Optional.ofNullable(usuario))
            }
            
            override fun onCancelled(error: DatabaseError) {
                logger.error("Error buscando usuario por ID: ${error.message}")
                future.complete(Optional.empty())
            }
        })
        
        return try {
            future.get()
        } catch (e: Exception) {
            logger.error("Error recuperando usuario por ID: ${e.message}")
            Optional.empty()
        }
    }
    
    override fun save(usuario: Usuario): Usuario {
        val savedUsuario = if (usuario.id == 0L) {
            // Nuevo usuario
            val newId = idCounter.getAndIncrement()
            val newUsuario = usuario.copy(id = newId)
            
            val userData = convertToMap(newUsuario)
            usuariosRef.child(newId.toString()).setValueAsync(userData).get()
            
            // Actualizar índice de emails
            emailIndex[newUsuario.email.lowercase()] = newId
            
            newUsuario
        } else {
            // Actualizar usuario existente
            val userData = convertToMap(usuario)
            usuariosRef.child(usuario.id.toString()).updateChildrenAsync(userData).get()
            
            // Actualizar índice de emails si cambió el email
            emailIndex[usuario.email.lowercase()] = usuario.id
            
            usuario
        }
        
        return savedUsuario
    }
    
    override fun findAll(): List<Usuario> {
        val future = CompletableFuture<List<Usuario>>()
        
        usuariosRef.addListenerForSingleValueEvent(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val usuarios = mutableListOf<Usuario>()
                snapshot.children.forEach { child ->
                    val usuario = child.getValue(Usuario::class.java)
                    if (usuario != null) {
                        usuarios.add(usuario)
                    }
                }
                future.complete(usuarios)
            }
            
            override fun onCancelled(error: DatabaseError) {
                logger.error("Error listando usuarios: ${error.message}")
                future.complete(emptyList())
            }
        })
        
        return try {
            future.get()
        } catch (e: Exception) {
            logger.error("Error recuperando lista de usuarios: ${e.message}")
            emptyList()
        }
    }
    
    override fun deleteById(id: Long) {
        // Primero obtener el usuario para poder eliminar el índice de email
        findById(id).ifPresent { usuario ->
            emailIndex.remove(usuario.email.lowercase())
        }
        
        usuariosRef.child(id.toString()).removeValueAsync()
    }
    
    /**
     * Convierte un objeto Usuario a un Map para Firebase
     */
    private fun convertToMap(usuario: Usuario): Map<String, Any> {
        val map = HashMap<String, Any>()
        map["id"] = usuario.id
        map["nombre"] = usuario.nombre
        map["email"] = usuario.email
        map["password"] = usuario.password
        map["rol"] = usuario.rol
        map["activo"] = usuario.activo
        return map
    }
} 