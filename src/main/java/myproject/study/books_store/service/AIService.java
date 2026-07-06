package myproject.study.books_store.service;

import myproject.study.books_store.dto.AIChatRequest;
import myproject.study.books_store.dto.AIChatResponse;
import myproject.study.books_store.dto.AISearchRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Service for interacting with Python AI Service
 */
@Service
public class AIService {

    // @Value("${ai.service.url:http://localhost:8000}")
    @Value("${ai.service.url}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate;

    public AIService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Send chat message to AI service
     */
    public AIChatResponse chat(AIChatRequest request) {
        String url = aiServiceUrl + "/api/chat";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<AIChatRequest> entity = new HttpEntity<>(request, headers);

        return restTemplate.postForObject(url, entity, AIChatResponse.class);
    }

    /**
     * Semantic search for books
     */
    public Object search(AISearchRequest request) {
        String url = aiServiceUrl + "/api/search";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<AISearchRequest> entity = new HttpEntity<>(request, headers);

        return restTemplate.postForObject(url, entity, Object.class);
    }

    /**
     * Get similar books
     */
    public Object getSimilarBooks(Long bookId, Integer topK) {
        String url = aiServiceUrl + "/api/similar";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        var request = new SimilarBooksRequest(bookId, topK);
        HttpEntity<SimilarBooksRequest> entity = new HttpEntity<>(request, headers);

        return restTemplate.postForObject(url, entity, Object.class);
    }

    /**
     * Check AI service health
     */
    public Object checkHealth() {
        String url = aiServiceUrl + "/health";
        return restTemplate.getForObject(url, Object.class);
    }

    // Inner class for similar books request
    private static class SimilarBooksRequest {

        public Long book_id;
        public Integer top_k;

        public SimilarBooksRequest(Long bookId, Integer topK) {
            this.book_id = bookId;
            this.top_k = topK != null ? topK : 5;
        }
    }
}
