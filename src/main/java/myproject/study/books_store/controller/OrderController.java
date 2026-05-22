package myproject.study.books_store.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import myproject.study.books_store.model.Order;
import myproject.study.books_store.model.User;
import myproject.study.books_store.service.OrderService;
import myproject.study.books_store.service.UserService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;

    public OrderController(OrderService orderService, UserService userService) {
        this.orderService = orderService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<?> listOrders(Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Chưa đăng nhập!"));
            }

            List<Order> orders = orderService.getUserOrders(user);
            
            long completedCount = 0;
            long pendingCount = 0;
            
            if (orders != null) {
                completedCount = orders.stream()
                    .filter(o -> "COMPLETED".equals(o.getStatus()))
                    .count();
                pendingCount = orders.stream()
                    .filter(o -> "PENDING".equals(o.getStatus()))
                    .count();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("orders", orders);
            response.put("totalSpent", orderService.getUserTotalSpent(user));
            response.put("totalOrders", orders != null ? orders.size() : 0);
            response.put("completedCount", completedCount);
            response.put("pendingCount", pendingCount);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi tải danh sách đơn hàng: " + e.getMessage()));
        }
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<?> viewOrder(@PathVariable String orderId, 
                                      Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Chưa đăng nhập!"));
            }

            Optional<Order> orderOpt = orderService.getOrderById(orderId);
            if (orderOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Không tìm thấy đơn hàng!"));
            }

            Order order = orderOpt.get();
            if (!order.getUser().getUserId().equals(user.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Bạn không có quyền xem đơn hàng này!"));
            }

            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi tải đơn hàng: " + e.getMessage()));
        }
    }

    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable String orderId,
                                        Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Chưa đăng nhập!"));
            }

            Optional<Order> orderOpt = orderService.getOrderById(orderId);
            if (orderOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Không tìm thấy đơn hàng!"));
            }

            Order order = orderOpt.get();
            if (!order.getUser().getUserId().equals(user.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Bạn không có quyền hủy đơn hàng này!"));
            }

            if (!order.getStatus().equals("PENDING")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Chỉ có thể hủy đơn hàng chưa hoàn tất!"));
            }

            orderService.cancelOrder(orderId);
            return ResponseEntity.ok(Map.of("message", "Hủy đơn hàng thành công!"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Lỗi khi hủy đơn hàng: " + e.getMessage()));
        }
    }

    @GetMapping("/admin/all")
    public ResponseEntity<?> adminListAllOrders() {
        try {
            List<Order> orders = orderService.getOrdersByStatus("COMPLETED");
            
            Map<String, Object> response = new HashMap<>();
            response.put("orders", orders);
            response.put("totalRevenue", orderService.getTotalRevenue());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi tải danh sách đơn hàng: " + e.getMessage()));
        }
    }

    private User getUserFromAuthentication(Authentication authentication) {
        if (authentication == null) {
            return null;
        }

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
