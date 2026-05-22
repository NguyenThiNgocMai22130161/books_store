package myproject.study.books_store.controller;

import myproject.study.books_store.model.Book;
import myproject.study.books_store.model.Review;
import myproject.study.books_store.model.User;
import myproject.study.books_store.repository.BookRepository;
import myproject.study.books_store.repository.ReviewRepository;
import myproject.study.books_store.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired private ReviewRepository reviewRepository;
    @Autowired private BookRepository bookRepository;
    @Autowired private UserRepository userRepository;

    // ── Lấy tất cả đánh giá của một cuốn sách ──────────────────────────────
    @GetMapping("/book/{bookId}")
    public ResponseEntity<?> getReviewsByBook(@PathVariable Long bookId) {
        List<Review> reviews = reviewRepository.findByBookIdOrderByCreatedAtDesc(bookId);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Review r : reviews) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", r.getId());
            item.put("username", r.getUser().getUsername());
            item.put("fullName", r.getUser().getFullName());
            item.put("rating", r.getRating());
            item.put("comment", r.getComment());
            item.put("createdAt", r.getCreatedAt());
            item.put("updatedAt", r.getUpdatedAt());
            result.add(item);
        }
        return ResponseEntity.ok(result);
    }

    // ── Thêm đánh giá mới ──────────────────────────────────────────────────
    @PostMapping("/book/{bookId}")
    public ResponseEntity<?> addReview(
            @PathVariable Long bookId,
            @RequestBody Map<String, Object> body,
            Authentication auth) {

        if (auth == null) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập"));

        User user = userRepository.findByUsername(auth.getName()).orElse(null);
        Book book = bookRepository.findById(bookId).orElse(null);

        if (user == null || book == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy người dùng hoặc sách"));

        if (reviewRepository.existsByUserUserIdAndBookId(user.getUserId(), bookId))
            return ResponseEntity.badRequest().body(Map.of("message", "Bạn đã đánh giá sách này rồi"));

        int rating = Integer.parseInt(body.get("rating").toString());
        String comment = body.getOrDefault("comment", "").toString().trim();

        if (rating < 1 || rating > 5)
            return ResponseEntity.badRequest().body(Map.of("message", "Đánh giá phải từ 1 đến 5 sao"));

        Review review = new Review(user, book, rating, comment);
        reviewRepository.save(review);

        return ResponseEntity.ok(Map.of("message", "Đã gửi đánh giá thành công"));
    }

    // ── Cập nhật đánh giá ──────────────────────────────────────────────────
    @PutMapping("/{reviewId}")
    public ResponseEntity<?> updateReview(
            @PathVariable Long reviewId,
            @RequestBody Map<String, Object> body,
            Authentication auth) {

        if (auth == null) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập"));

        Review review = reviewRepository.findById(reviewId).orElse(null);
        if (review == null) return ResponseEntity.notFound().build();

        // Chỉ chủ nhân review mới được sửa
        if (!review.getUser().getUsername().equals(auth.getName()))
            return ResponseEntity.status(403).body(Map.of("message", "Không có quyền chỉnh sửa"));

        int rating = Integer.parseInt(body.get("rating").toString());
        String comment = body.getOrDefault("comment", "").toString().trim();

        if (rating < 1 || rating > 5)
            return ResponseEntity.badRequest().body(Map.of("message", "Đánh giá phải từ 1 đến 5 sao"));

        review.setRating(rating);
        review.setComment(comment);
        review.setUpdatedAt(LocalDateTime.now());
        reviewRepository.save(review);

        return ResponseEntity.ok(Map.of("message", "Đã cập nhật đánh giá"));
    }

    // ── Xóa đánh giá ──────────────────────────────────────────────────────
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable Long reviewId, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();

        Review review = reviewRepository.findById(reviewId).orElse(null);
        if (review == null) return ResponseEntity.notFound().build();

        // Chủ nhân review hoặc admin mới được xóa
        boolean isOwner = review.getUser().getUsername().equals(auth.getName());
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isOwner && !isAdmin)
            return ResponseEntity.status(403).body(Map.of("message", "Không có quyền xóa"));

        reviewRepository.deleteById(reviewId);
        return ResponseEntity.ok(Map.of("message", "Đã xóa đánh giá"));
    }
}