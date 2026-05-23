package myproject.study.books_store.controller;

import myproject.study.books_store.model.Book;
import myproject.study.books_store.model.User;
import myproject.study.books_store.model.Wishlist;
import myproject.study.books_store.repository.BookRepository;
import myproject.study.books_store.repository.UserRepository;
import myproject.study.books_store.repository.WishlistRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(
        origins = "http://localhost:5173",
        allowCredentials = "true"
)
public class WishlistController {

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookRepository bookRepository;

    // ==============================
    // GET WISHLIST
    // ==============================

    @GetMapping
    public ResponseEntity<?> getWishlist(Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        User user = userRepository
                .findByUsername(auth.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(401).body("User not found");
        }

        List<Map<String, Object>> result = new ArrayList<>();

        List<Wishlist> wishlist =
                wishlistRepository.findByUserUserId(user.getUserId());

        for (Wishlist w : wishlist) {

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

    // ==============================
    // ADD TO WISHLIST
    // ==============================

    @PostMapping("/{bookId}")
    public ResponseEntity<?> addToWishlist(
            @PathVariable Long bookId,
            Authentication auth
    ) {

        if (auth == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        User user = userRepository
                .findByUsername(auth.getName())
                .orElse(null);

        Book book = bookRepository
                .findById(bookId)
                .orElse(null);

        if (user == null || book == null) {
            return ResponseEntity.badRequest()
                    .body("Invalid user or book");
        }

        boolean exists =
                wishlistRepository
                        .existsByUserUserIdAndBookId(
                                user.getUserId(),
                                bookId
                        );

        if (exists) {

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Đã có trong yêu thích"
                    )
            );
        }

        Wishlist wishlist = new Wishlist(user, book);

        wishlistRepository.save(wishlist);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Đã thêm vào yêu thích"
                )
        );
    }

    // ==============================
    // REMOVE WISHLIST
    // ==============================

    @DeleteMapping("/{bookId}")
    public ResponseEntity<?> removeFromWishlist(
            @PathVariable Long bookId,
            Authentication auth
    ) {

        if (auth == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        User user = userRepository
                .findByUsername(auth.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(401).body("User not found");
        }

        Optional<Wishlist> wishlist =
                wishlistRepository
                        .findByUserUserIdAndBookId(
                                user.getUserId(),
                                bookId
                        );

        if (wishlist.isEmpty()) {

            return ResponseEntity.badRequest()
                    .body("Wishlist not found");
        }

        wishlistRepository.delete(wishlist.get());

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Đã xóa khỏi yêu thích"
                )
        );
    }

    // ==============================
    // CHECK WISHLIST
    // ==============================

    @GetMapping("/check/{bookId}")
    public ResponseEntity<?> checkWishlist(
            @PathVariable Long bookId,
            Authentication auth
    ) {

        if (auth == null) {

            return ResponseEntity.ok(
                    Map.of(
                            "isWishlisted",
                            false
                    )
            );
        }

        User user = userRepository
                .findByUsername(auth.getName())
                .orElse(null);

        if (user == null) {

            return ResponseEntity.ok(
                    Map.of(
                            "isWishlisted",
                            false
                    )
            );
        }

        boolean exists =
                wishlistRepository
                        .existsByUserUserIdAndBookId(
                                user.getUserId(),
                                bookId
                        );

        return ResponseEntity.ok(
                Map.of(
                        "isWishlisted",
                        exists
                )
        );
    }
}