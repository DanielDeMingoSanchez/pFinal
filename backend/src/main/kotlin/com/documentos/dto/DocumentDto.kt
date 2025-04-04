package com.documentos.dto

import com.documentos.model.Category
import java.time.LocalDateTime

data class DocumentUploadDto(
    val name: String,
    val category: Category,
    val description: String?
)

data class DocumentResponseDto(
    val id: Long,
    val name: String,
    val fileUrl: String,
    val fileSize: Long,
    val category: Category,
    val uploadedAt: LocalDateTime,
    val updatedAt: LocalDateTime,
    val description: String?,
    val uploadedBy: UserResponseDto
)

data class DocumentUpdateDto(
    val name: String?,
    val category: Category?,
    val description: String?
) 