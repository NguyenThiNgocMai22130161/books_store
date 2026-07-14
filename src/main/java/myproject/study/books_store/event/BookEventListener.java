package myproject.study.books_store.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.client.RestTemplate;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Listener for book change events
 * Sends webhook to AI service after transaction commits
 */
@Component
public class BookEventListener {
    
    private static final Logger logger = LoggerFactory.getLogger(BookEventListener.class);
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final int MAX_RETRIES = 3;
    private static final long RETRY_DELAY_MS = 1000;
    
    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;
    
    @Value("${ai.service.internal-api-key:}")
    private String internalApiKey;
    
    @Value("${ai.service.webhook.enabled:true}")
    private boolean webhookEnabled;
    
    private final RestTemplate restTemplate;
    
    public BookEventListener() {
        this.restTemplate = new RestTemplate();
        // Set timeouts
        this.restTemplate.getInterceptors().add((request, body, execution) -> {
            // Connection timeout and read timeout handled by RestTemplate config
            return execution.execute(request, body);
        });
    }
    
    /**
     * Listen to BookChangedEvent AFTER transaction commits
     * Async to avoid blocking the main thread
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleBookChangedEvent(BookChangedEvent event) {
        if (!webhookEnabled) {
            logger.info("Webhook disabled, skipping event: {}", event);
            return;
        }
        
        logger.info("[OK] Received BookChangedEvent: {}", event);
        
        try {
            sendWebhookWithRetry(event);
        } catch (Exception e) {
            // Log error but don't throw - this is post-commit, transaction already successful
            logger.error("[ERROR] Failed to send webhook after {} retries for event {}: {}", 
                    MAX_RETRIES, event.getEventId(), e.getMessage());
        }
    }
    
    /**
     * Send webhook with exponential backoff retry
     */
    private void sendWebhookWithRetry(BookChangedEvent event) {
        int attempt = 0;
        Exception lastException = null;
        
        while (attempt < MAX_RETRIES) {
            try {
                sendWebhook(event);
                logger.info("[OK] Successfully sent webhook for event {} (attempt {})", 
                        event.getEventId(), attempt + 1);
                return; // Success
            } catch (Exception e) {
                lastException = e;
                attempt++;
                
                if (isRetryable(e) && attempt < MAX_RETRIES) {
                    long delay = RETRY_DELAY_MS * (long) Math.pow(2, attempt - 1);
                    logger.warn("[WARN] Webhook attempt {} failed for event {}, retrying in {}ms: {}", 
                            attempt, event.getEventId(), delay, e.getMessage());
                    
                    try {
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Retry interrupted", ie);
                    }
                } else {
                    break;
                }
            }
        }
        
        // All retries failed
        throw new RuntimeException("Webhook failed after " + MAX_RETRIES + " attempts", lastException);
    }
    
    /**
     * Send webhook to AI service
     */
    private void sendWebhook(BookChangedEvent event) {
        String url = aiServiceUrl + "/ingest/events/book-changed";
        
        // Build payload
        Map<String, Object> payload = new HashMap<>();
        payload.put("event_id", event.getEventId());
        payload.put("book_id", event.getBookId());
        payload.put("event_type", event.getEventType().name());
        payload.put("occurred_at", event.getOccurredAt().format(ISO_FORMATTER));
        
        // Build headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        // Add internal API key if configured
        if (internalApiKey != null && !internalApiKey.isEmpty()) {
            headers.set("X-Internal-API-Key", internalApiKey);
        }
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
        
        // Send request
        logger.info("[OK] Sending webhook to {}: {}", url, payload);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Webhook returned non-2xx status: " + response.getStatusCode());
        }
        
        logger.info("[OK] Webhook response: {}", response.getBody());
    }
    
    /**
     * Check if exception is retryable
     */
    private boolean isRetryable(Exception e) {
        String message = e.getMessage();
        if (message == null) {
            return true;
        }
        
        // Don't retry client errors (400, 401, 403, 404)
        if (message.contains("400") || message.contains("401") || 
            message.contains("403") || message.contains("404")) {
            return false;
        }
        
        // Retry server errors (500, 502, 503, 504)
        // Retry connection errors, timeouts
        return true;
    }
}
