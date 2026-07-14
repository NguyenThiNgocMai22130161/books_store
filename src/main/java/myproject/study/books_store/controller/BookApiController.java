package myproject.study.books_store.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import myproject.study.books_store.dto.BookWithRatingDTO;
import myproject.study.books_store.model.Book;
import myproject.study.books_store.repository.ReviewRepository;
import myproject.study.books_store.service.BookService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/books")
public class BookApiController {

    private final BookService bookService;
    private final ReviewRepository reviewRepository;

    public BookApiController(BookService bookService, ReviewRepository reviewRepository) {
        this.bookService = bookService;
        this.reviewRepository = reviewRepository;
    }

    // ─── GET /api/books — 1 query rating cho toàn bộ danh sách ─────────────
    @GetMapping
    public ResponseEntity<List<BookWithRatingDTO>> getAllBooks(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice
    ) {
        List<Book> books = (title != null || author != null || category != null
                || minPrice != null || maxPrice != null)
                ? bookService.searchBooks(title, author, category, minPrice, maxPrice)
                : bookService.getAllBooks();

        // 1 query lấy rating của tất cả sách cùng lúc
        Map<Long, double[]> ratingMap = buildRatingMap();

        List<BookWithRatingDTO> result = books.stream()
                .map(b -> toDTO(b, ratingMap.get(b.getId())))
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ─── GET /api/books/{id} — 2 query cho 1 cuốn ───────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<BookWithRatingDTO> getBookById(@PathVariable String id) {
        return bookService.getBookById(id)
                .map(book -> {
                    Double avg   = reviewRepository.findAvgRatingByBookId(book.getId());
                    Long   total = reviewRepository.countApprovedByBookId(book.getId());
                    return ResponseEntity.ok(new BookWithRatingDTO(
                            book.getId(), book.getTitle(), book.getAuthor(), book.getPrice(),
                            book.getYear(), book.getCategory(), book.getImageUrl(),
                            book.getDescription(), book.getQuantity(), avg, total));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── POST /api/books ─────────────────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Book> createBook(@RequestBody Book book) {
        return ResponseEntity.ok(bookService.saveBook(book));
    }

    // ─── PUT /api/books/{id} ─────────────────────────────────────────────────
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Book> updateBook(@PathVariable String id,
                                           @RequestBody Book bookDetails) {
        Book updated = bookService.updateBook(id, bookDetails);
        return updated != null ? ResponseEntity.ok(updated)
                               : ResponseEntity.notFound().build();
    }

    // ─── DELETE /api/books/{id} ──────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBook(@PathVariable String id) {
        bookService.deleteBook(id);
        return ResponseEntity.ok().build();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * 1 query GROUP BY lấy avgRating + totalReviews của tất cả sách.
     * Trả về Map<bookId, [avgRating, totalReviews]>
     */
    private Map<Long, double[]> buildRatingMap() {
        List<Map<String, Object>> rows = reviewRepository.findRatingSummaryForAllBooks();
        Map<Long, double[]> map = new HashMap<>();
        for (Map<String, Object> row : rows) {
            Long   bookId       = ((Number) row.get("bookId")).longValue();
            Double avgRating    = ((Number) row.get("avgRating")).doubleValue();
            Long   totalReviews = ((Number) row.get("totalReviews")).longValue();
            map.put(bookId, new double[]{ avgRating, totalReviews });
        }
        return map;
    }

    private BookWithRatingDTO toDTO(Book book, double[] rating) {
        Double avg   = (rating != null) ? rating[0] : null;
        Long   total = (rating != null) ? (long) rating[1] : 0L;
        return new BookWithRatingDTO(
                book.getId(), book.getTitle(), book.getAuthor(), book.getPrice(),
                book.getYear(), book.getCategory(), book.getImageUrl(),
                book.getDescription(), book.getQuantity(), avg, total);
    }
}
