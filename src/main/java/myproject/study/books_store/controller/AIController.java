package myproject.study.books_store.controller;

import myproject.study.books_store.dto.AIChatRequest;
import myproject.study.books_store.dto.AIChatResponse;
import myproject.study.books_store.dto.AISearchRequest;
import myproject.study.books_store.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for AI Chatbot endpoints
 * Proxies requests to Python AI service
 */
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AIController {
    
    @Autowired
    private AIService aiService;
    
    /**
     * Chat with AI - Main chatbot endpoint
     * POST /api/ai/chat
     */
    @PostMapping("/chat")
    public ResponseEntity<AIChatResponse> chat(@RequestBody AIChatRequest request) {
        try {
            AIChatResponse response = aiService.chat(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Return error response
            AIChatResponse errorResponse = new AIChatResponse();
            errorResponse.setAnswer("Xin lỗi, AI service đang bận. Vui lòng thử lại sau.");
            errorResponse.setIntent("error");
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * Semantic search for books
     * POST /api/ai/search
     */
    @PostMapping("/search")
    public ResponseEntity<?> search(@RequestBody AISearchRequest request) {
        try {
            Object response = aiService.search(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body("AI search error: " + e.getMessage());
        }
    }
    
    /**
     * Get similar books
     * GET /api/ai/similar/{bookId}
     */
    @GetMapping("/similar/{bookId}")
    public ResponseEntity<?> getSimilarBooks(
            @PathVariable Long bookId,
            @RequestParam(defaultValue = "5") Integer topK) {
        try {
            Object response = aiService.getSimilarBooks(bookId, topK);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body("AI similar books error: " + e.getMessage());
        }
    }
    
    /**
     * Health check for AI service
     * GET /api/ai/health
     */
    @GetMapping("/health")
    public ResponseEntity<?> checkHealth() {
        try {
            Object response = aiService.checkHealth();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(503)
                .body("AI service is unavailable: " + e.getMessage());
        }
    }
}
