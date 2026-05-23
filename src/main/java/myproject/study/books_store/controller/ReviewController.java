package myproject.study.books_store.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import myproject.study.books_store.model.*;
import myproject.study.books_store.repository.BookRepository;
import myproject.study.books_store.repository.OrderRepository;
import myproject.study.books_store.repository.ReviewRepository;
import myproject.study.books_store.service.UserService;

import java.util.*;

@RestController
@RequestMapping("/api")
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final BookRepository bookRepository;
    private final UserService userService;
    private final OrderRepository orderRepository;

    public ReviewController(ReviewRepository reviewRepository, 
                            BookRepository bookRepository, 
                            UserService userService,
                            OrderRepository orderRepository) {
        this.reviewRepository = reviewRepository;
        this.bookRepository = bookRepository;
        this.userService = userService;
        this.orderRepository = orderRepository;
    }

    /**
     * Lấy danh sách đánh giá của một cuốn sách (đã được APPROVED)
     */
    @GetMapping("/books/{bookId}/reviews")
    public ResponseEntity<?> getBookReviews(@PathVariable Long bookId) {
        try {
            List<Review> reviews = reviewRepository.findByBookIdAndStatus(bookId, ReviewStatus.APPROVED);
            
            // Map to clean DTO structure
            List<Map<String, Object>> response = new ArrayList<>();
            for (Review r : reviews) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", r.getId());
                map.put("userId", r.getUser().getUserId());
                map.put("username", r.getUser().getUsername());
                map.put("fullName", r.getUser().getFullName());
                map.put("rating", r.getRating());
                map.put("comment", r.getComment());
                map.put("imageUrl", r.getImageUrl());
                map.put("isVerifiedPurchase", r.getIsVerifiedPurchase());
                map.put("createdAt", r.getCreatedAt());
                map.put("updatedAt", r.getUpdatedAt());
                response.add(map);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi lấy đánh giá: " + e.getMessage()));
        }
    }

    /**
     * Kiểm tra xem user hiện tại có thể đánh giá cuốn sách này không
     */
    @GetMapping("/books/{bookId}/reviews/check-purchase")
    public ResponseEntity<?> checkPurchaseStatus(@PathVariable Long bookId,
                                                 Authentication authentication) {
        try {
            if (authentication == null) {
                return ResponseEntity.ok(Map.of("canReview", false, "reason", "not_logged_in"));
            }

            User user = getUserFromAuthentication(authentication);
            if (user == null) {
                return ResponseEntity.ok(Map.of("canReview", false, "reason", "not_logged_in"));
            }

            boolean isAdmin = user.getRoles().contains(myproject.study.books_store.model.Role.ROLE_ADMIN);
            if (isAdmin) {
                return ResponseEntity.ok(Map.of("canReview", false, "reason", "is_admin"));
            }

            // Kiểm tra xem đã có đơn hàng COMPLETED chứa cuốn sách này chưa
            System.out.println("=== DIAGNOSING REVIEW PERMISSION ===");
            System.out.println("User: " + user.getUsername() + " (ID: " + user.getUserId() + ")");
            System.out.println("Book ID to check: " + bookId);
            
            List<Order> completedOrders = orderRepository.findByUserUserIdAndStatus(user.getUserId(), "COMPLETED");
            System.out.println("Found Completed Orders count: " + (completedOrders != null ? completedOrders.size() : 0));
            
            boolean hasPurchased = false;
            if (completedOrders != null) {
                for (Order order : completedOrders) {
                    System.out.println("  Order ID: " + order.getId() + ", Code: " + order.getOrderCode() + ", Status: " + order.getStatus());
                    for (OrderItem item : order.getItems()) {
                        Long itemBookId = item.getBook() != null ? item.getBook().getId() : null;
                        String itemBookTitle = item.getBook() != null ? item.getBook().getTitle() : "Unknown";
                        System.out.println("    - Item Book ID: " + itemBookId + " (" + itemBookTitle + ")");
                        if (itemBookId != null && itemBookId.equals(bookId)) {
                            hasPurchased = true;
                            System.out.println("      MATCH FOUND!");
                        }
                    }
                }
            }
            System.out.println("Final hasPurchased result: " + hasPurchased);
            System.out.println("====================================");

            if (hasPurchased) {
                return ResponseEntity.ok(Map.of("canReview", true));
            } else {
                return ResponseEntity.ok(Map.of("canReview", false, "reason", "not_purchased"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi kiểm tra lịch sử mua hàng: " + e.getMessage()));
        }
    }

    /**
     * Tạo mới một đánh giá cho sách (cần đăng nhập)
     */
    @PostMapping("/reviews")
    public ResponseEntity<?> createReview(@RequestBody Map<String, Object> request,
                                          Authentication authentication) {
        try {
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Vui lòng đăng nhập để gửi đánh giá!"));
            }

            User user = getUserFromAuthentication(authentication);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Vui lòng đăng nhập để gửi đánh giá!"));
            }

            Long bookId = Long.valueOf(String.valueOf(request.get("bookId")));
            Integer rating = Integer.valueOf(String.valueOf(request.get("rating")));
            String comment = (String) request.get("comment");
            String imageUrl = (String) request.get("imageUrl");

            if (rating < 1 || rating > 5) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Số sao đánh giá phải từ 1 đến 5!"));
            }

            Optional<Book> bookOpt = bookRepository.findById(bookId);
            if (bookOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Không tìm thấy cuốn sách cần đánh giá!"));
            }

            // Kiểm tra xem đã có đơn hàng COMPLETED chứa cuốn sách này chưa
            System.out.println("=== DIAGNOSING REVIEW SUBMISSION ===");
            System.out.println("User: " + user.getUsername() + " (ID: " + user.getUserId() + ")");
            System.out.println("Book ID to check: " + bookId);
            
            List<Order> completedOrders = orderRepository.findByUserUserIdAndStatus(user.getUserId(), "COMPLETED");
            System.out.println("Found Completed Orders count: " + (completedOrders != null ? completedOrders.size() : 0));
            
            boolean hasPurchased = false;
            if (completedOrders != null) {
                for (Order order : completedOrders) {
                    System.out.println("  Order ID: " + order.getId() + ", Code: " + order.getOrderCode() + ", Status: " + order.getStatus());
                    for (OrderItem item : order.getItems()) {
                        Long itemBookId = item.getBook() != null ? item.getBook().getId() : null;
                        String itemBookTitle = item.getBook() != null ? item.getBook().getTitle() : "Unknown";
                        System.out.println("    - Item Book ID: " + itemBookId + " (" + itemBookTitle + ")");
                        if (itemBookId != null && itemBookId.equals(bookId)) {
                            hasPurchased = true;
                            System.out.println("      MATCH FOUND!");
                        }
                    }
                }
            }
            System.out.println("Final hasPurchased result: " + hasPurchased);
            System.out.println("====================================");

            if (!hasPurchased) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Bạn chỉ có thể đánh giá sau khi đã mua hàng thành công và nhận được sách!"));
            }

            Review review = new Review();
            review.setUser(user);
            review.setBook(bookOpt.get());
            review.setRating(rating);
            review.setComment(comment);
            review.setImageUrl(imageUrl);
            review.setStatus(ReviewStatus.APPROVED); // Mặc định duyệt tự động
            review.setIsVerifiedPurchase(true); 

            reviewRepository.save(review);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đăng đánh giá thành công!",
                "review", Map.of(
                    "id", review.getId(),
                    "username", user.getUsername(),
                    "fullName", user.getFullName(),
                    "rating", review.getRating(),
                    "comment", review.getComment(),
                    "createdAt", review.getCreatedAt()
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Lỗi khi lưu đánh giá: " + e.getMessage()));
        }
    }

    /**
     * Chỉnh sửa đánh giá của người dùng (chỉ chủ nhân đánh giá mới được sửa)
     */
    @PutMapping("/reviews/{reviewId}")
    public ResponseEntity<?> updateReview(@PathVariable Long reviewId,
                                          @RequestBody Map<String, Object> request,
                                          Authentication authentication) {
        try {
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Vui lòng đăng nhập để chỉnh sửa đánh giá!"));
            }

            User user = getUserFromAuthentication(authentication);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Vui lòng đăng nhập để chỉnh sửa đánh giá!"));
            }

            Optional<Review> reviewOpt = reviewRepository.findById(reviewId);
            if (reviewOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Không tìm thấy đánh giá!"));
            }

            Review review = reviewOpt.get();

            // Chỉ cho phép chủ nhân đánh giá sửa
            if (!review.getUser().getUserId().equals(user.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Bạn không có quyền chỉnh sửa đánh giá này!"));
            }

            Integer rating = Integer.valueOf(String.valueOf(request.get("rating")));
            String comment = (String) request.get("comment");

            if (rating < 1 || rating > 5) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Số sao đánh giá phải từ 1 đến 5!"));
            }
            if (comment == null || comment.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Nội dung đánh giá không được để trống!"));
            }

            review.setRating(rating);
            review.setComment(comment.trim());
            reviewRepository.save(review);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã cập nhật đánh giá thành công!",
                "review", Map.of(
                    "id", review.getId(),
                    "rating", review.getRating(),
                    "comment", review.getComment(),
                    "updatedAt", review.getUpdatedAt()
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Lỗi khi cập nhật đánh giá: " + e.getMessage()));
        }
    }

    private User getUserFromAuthentication(Authentication authentication) {
        if (authentication.getPrincipal() instanceof org.springframework.security.oauth2.core.user.OAuth2User) {
            org.springframework.security.oauth2.core.user.OAuth2User oAuth2User = 
                    (org.springframework.security.oauth2.core.user.OAuth2User) authentication.getPrincipal();
            String email = oAuth2User.getAttribute("email");
            if (email != null && !email.trim().isEmpty()) {
                Optional<User> user = userService.findByEmail(email);
                if (user.isPresent()) {
                    return user.get();
                }
            }
        }
        
        String principal = authentication.getName();
        Optional<User> user = userService.findByUsername(principal);
        if (user.isEmpty()) {
            user = userService.findByEmail(principal);
        }
        return user.orElse(null);
    }
}
