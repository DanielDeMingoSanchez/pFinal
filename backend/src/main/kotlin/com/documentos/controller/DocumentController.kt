package com.documentos.controller

import com.documentos.dto.DocumentResponseDto
import com.documentos.dto.DocumentUploadDto
import com.documentos.model.Category
import com.documentos.security.UserPrincipal
import com.documentos.service.DocumentService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = ["http://localhost:3000"])
class DocumentController(
    private val documentService: DocumentService
) {
    @PostMapping
    fun uploadDocument(
        @RequestParam("file") file: MultipartFile,
        @RequestParam("name") name: String,
        @RequestParam("category") category: Category,
        @RequestParam("description", required = false) description: String?,
        @AuthenticationPrincipal userPrincipal: UserPrincipal
    ): ResponseEntity<DocumentResponseDto> {
        val documentDto = DocumentUploadDto(
            name = name,
            category = category,
            description = description
        )
        
        val document = documentService.uploadDocument(file, documentDto, userPrincipal.id)
        return ResponseEntity.ok(document)
    }

    @GetMapping("/category/{category}")
    fun getDocumentsByCategory(
        @PathVariable category: Category,
        pageable: Pageable
    ): ResponseEntity<Page<DocumentResponseDto>> {
        val documents = documentService.getDocumentsByCategory(category, pageable)
        return ResponseEntity.ok(documents)
    }

    @GetMapping("/user")
    fun getUserDocuments(
        @AuthenticationPrincipal userPrincipal: UserPrincipal,
        pageable: Pageable
    ): ResponseEntity<Page<DocumentResponseDto>> {
        val documents = documentService.getDocumentsByUser(userPrincipal.id, pageable)
        return ResponseEntity.ok(documents)
    }
} 