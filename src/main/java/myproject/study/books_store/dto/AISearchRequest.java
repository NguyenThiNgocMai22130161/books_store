package myproject.study.books_store.dto;

import lombok.Data;

/**
 * Request DTO for AI Search
 */
@Data
public class AISearchRequest {
    private String query;
    private Integer topK = 5;
    private String category;
    private Double minPrice;
    private Double maxPrice;
}
