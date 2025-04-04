package com.documentos.service

import com.documentos.dto.DocumentResponseDto
import com.documentos.dto.DocumentUploadDto
import com.documentos.dto.DocumentUpdateDto
import com.documentos.dto.UserResponseDto
import com.documentos.model.Document
import com.documentos.model.Category
import com.documentos.repository.DocumentRepository
import com.documentos.repository.UserRepository
import com.google.cloud.storage.BlobId
import com.google.cloud.storage.BlobInfo
import com.google.cloud.storage.Storage
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.util.*

@Service
class DocumentService(
    private val documentRepository: DocumentRepository,
    private val userRepository: UserRepository,
    private val storage: Storage
) {
    @Value("\${firebase.storage.bucket}")
    private lateinit var bucketName: String

    @Transactional
    fun uploadDocument(
        file: MultipartFile,
        documentDto: DocumentUploadDto,
        userId: Long
    ): DocumentResponseDto {
        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found") }

        val fileName = "${UUID.randomUUID()}_${file.originalFilename}"
        val blobId = BlobId.of(bucketName, fileName)
        val blobInfo = BlobInfo.newBuilder(blobId)
            .setContentType(file.contentType)
            .build()

        val blob = storage.create(blobInfo, file.bytes)
        
        val document = Document(
            name = documentDto.name,
            fileUrl = blob.mediaLink,
            fileSize = file.size,
            category = documentDto.category,
            user = user,
            description = documentDto.description
        )

        val savedDocument = documentRepository.save(document)
        
        return DocumentResponseDto(
            id = savedDocument.id!!,
            name = savedDocument.name,
            fileUrl = savedDocument.fileUrl,
            fileSize = savedDocument.fileSize,
            category = savedDocument.category,
            uploadedAt = savedDocument.uploadedAt,
            updatedAt = savedDocument.updatedAt,
            description = savedDocument.description,
            uploadedBy = UserResponseDto(
                id = user.id!!,
                email = user.email,
                name = user.name
            )
        )
    }

    fun getDocumentsByCategory(category: Category, pageable: Pageable): Page<DocumentResponseDto> {
        return documentRepository.findByCategory(category, pageable)
            .map { document -> mapToDocumentResponse(document) }
    }

    fun getDocumentsByUser(userId: Long, pageable: Pageable): Page<DocumentResponseDto> {
        return documentRepository.findByUserId(userId, pageable)
            .map { document -> mapToDocumentResponse(document) }
    }

    private fun mapToDocumentResponse(document: Document): DocumentResponseDto {
        return DocumentResponseDto(
            id = document.id!!,
            name = document.name,
            fileUrl = document.fileUrl,
            fileSize = document.fileSize,
            category = document.category,
            uploadedAt = document.uploadedAt,
            updatedAt = document.updatedAt,
            description = document.description,
            uploadedBy = UserResponseDto(
                id = document.user.id!!,
                email = document.user.email,
                name = document.user.name
            )
        )
    }
} 