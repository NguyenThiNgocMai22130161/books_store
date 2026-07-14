package myproject.study.books_store.event;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Event published when a book is created, updated, or deleted
 */
public class BookChangedEvent {
    private final String eventId;
    private final Long bookId;
    private final BookChangeType eventType;
    private final LocalDateTime occurredAt;

    public BookChangedEvent(Long bookId, BookChangeType eventType) {
        this.eventId = UUID.randomUUID().toString();
        this.bookId = bookId;
        this.eventType = eventType;
        this.occurredAt = LocalDateTime.now();
    }

    public String getEventId() {
        return eventId;
    }

    public Long getBookId() {
        return bookId;
    }

    public BookChangeType getEventType() {
        return eventType;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    @Override
    public String toString() {
        return "BookChangedEvent{" +
                "eventId='" + eventId + '\'' +
                ", bookId=" + bookId +
                ", eventType=" + eventType +
                ", occurredAt=" + occurredAt +
                '}';
    }
}
