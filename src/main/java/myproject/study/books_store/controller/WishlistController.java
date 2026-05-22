package myproject.study.books_store.controller;

import myproject.study.books_store.model.*;
import myproject.study.books_store.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    @Autowired private WishlistRepository wishlistRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private BookRepository bookRepository;

    // Lấy danh sách yêu thích
    @GetMapping
    public ResponseEntity<?> getWishlist(Authentication auth) {
        User user = userRepository.findByUsername(auth.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(401).build();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Wishlist w : wishlistRepository.findByUserUserId(user.getUserId())) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", w.getId());
            item.put("bookId", w.getBook().getId());
            item.put("title", w.getBook().getTitle());
            item.put("author", w.getBook().getAuthor());
            item.put("price", w.getBook().getPrice());
            item.put("imageUrl", w.getBook().getImageUrl());
            result.add(item);
        }
        return ResponseEntity.ok(result);
    }

    // Thêm vào yêu thích
    @PostMapping("/{bookId}")
    public ResponseEntity<?> addToWishlist(@PathVariable Long bookId, Authentication auth) {
        User user = userRepository.findByUsername(auth.getName()).orElse(null);
        Book book = bookRepository.findById(bookId).orElse(null);
        if (user == null || book == null) return ResponseEntity.badRequest().build();

        if (wishlistRepository.existsByUserUserIdAndBookId(user.getUserId(), bookId)) {
            return ResponseEntity.ok(Map.of("message", "Đã có trong yêu thích"));
        }
        wishlistRepository.save(new Wishlist(user, book));
        return ResponseEntity.ok(Map.of("message", "Đã thêm vào yêu thích"));
    }

    // Xóa khỏi yêu thích
    @DeleteMapping("/{bookId}")
    public ResponseEntity<?> removeFromWishlist(@PathVariable Long bookId, Authentication auth) {
        User user = userRepository.findByUsername(auth.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(401).build();
        wishlistRepository.deleteByUserUserIdAndBookId(user.getUserId(), bookId);
        return ResponseEntity.ok(Map.of("message", "Đã xóa khỏi yêu thích"));
    }

    // Kiểm tra trạng thái
    @GetMapping("/check/{bookId}")
    public ResponseEntity<?> checkWishlist(@PathVariable Long bookId, Authentication auth) {
        if (auth == null) return ResponseEntity.ok(Map.of("isWishlisted", false));
        User user = userRepository.findByUsername(auth.getName()).orElse(null);
        if (user == null) return ResponseEntity.ok(Map.of("isWishlisted", false));
        boolean exists = wishlistRepository.existsByUserUserIdAndBookId(user.getUserId(), bookId);
        return ResponseEntity.ok(Map.of("isWishlisted", exists));
    }
}