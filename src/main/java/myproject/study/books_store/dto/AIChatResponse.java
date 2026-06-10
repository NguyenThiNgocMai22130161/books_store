package myproject.study.books_store.dto;

import lombok.Data;
import java.util.List;

/**
 * Response DTO for AI Chat
 */
@Data
public class AIChatResponse {
    private String answer;
    private List<BookRecommendation> sources;
    private String intent;
    private String sessionId;
    
    @Data
    public static class BookRecommendation {
        private Long bookId;
        private String title;
        private String author;
        private Double price;
        private String category;
        private Double score;
    }
}
