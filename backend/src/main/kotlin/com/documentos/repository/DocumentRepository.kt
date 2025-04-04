package com.documentos.repository

import com.documentos.model.Document
import com.documentos.model.Category
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface DocumentRepository : JpaRepository<Document, Long> {
    fun findByUserId(userId: Long, pageable: Pageable): Page<Document>
    fun findByCategory(category: Category, pageable: Pageable): Page<Document>
    fun findByUserIdAndCategory(userId: Long, category: Category, pageable: Pageable): Page<Document>
} 