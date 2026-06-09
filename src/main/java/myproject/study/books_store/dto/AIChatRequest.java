package myproject.study.books_store.dto;

import lombok.Data;

/**
 * Request DTO for AI Chat
 */
@Data
public class AIChatRequest {
    private String message;
    private Long bookId;
    private String category;
    private String sessionId;
}
