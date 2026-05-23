package myproject.study.books_store.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import myproject.study.books_store.model.CartItem;
import myproject.study.books_store.model.Order;
import myproject.study.books_store.model.User;
import myproject.study.books_store.service.CartService;
import myproject.study.books_store.service.MoMoPaymentService;
import myproject.study.books_store.service.OrderService;
import myproject.study.books_store.service.UserService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final MoMoPaymentService moMoPaymentService;
    private final UserService userService;
    private final OrderService orderService;

    public CartController(CartService cartService, MoMoPaymentService moMoPaymentService, 
                         UserService userService, OrderService orderService) {
        this.cartService = cartService;
        this.moMoPaymentService = moMoPaymentService;
        this.userService = userService;
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<?> viewCart(Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            List<CartItem> cartItems = cartService.getCartItems(user);
            Double total = cartService.getCartTotal(user);
            int itemCount = cartService.getCartItemCount(user);

            Map<String, Object> response = new HashMap<>();
            response.put("cartItems", cartItems);
            response.put("total", total);
            response.put("itemCount", itemCount);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi tải giỏ hàng: " + e.getMessage()));
        }
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@RequestBody Map<String, Object> request,
                                      Authentication authentication) {
        try {
            System.out.println("=== CartController.addToCart ===");
            System.out.println("Request body: " + request);
            
            User user = getUserFromAuthentication(authentication);
            System.out.println("User: " + user.getUsername() + ", isAdmin: " + user.isAdmin());
            
            if (user.isAdmin()) {
                System.out.println("Admin cannot add to cart - rejecting");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Tài khoản admin không thể thêm sách vào giỏ hàng!"));
            }
            
            Object bookIdObj = request.get("bookId");
            String bookId = bookIdObj != null ? String.valueOf(bookIdObj) : null;
            Integer quantityObj = (Integer) request.get("quantity");
            int quantity = (quantityObj != null) ? quantityObj : 1;
            
            System.out.println("BookId: " + bookId + ", Quantity: " + quantity);
            
            cartService.addToCart(user, bookId, quantity);
            System.out.println("Successfully added to cart");
            return ResponseEntity.ok(Map.of("message", "Đã thêm vào giỏ hàng!"));
        } catch (Exception e) {
            System.err.println("Error adding to cart: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/update/{itemId}")
    public ResponseEntity<?> updateCart(@PathVariable String itemId,
                                       @RequestBody Map<String, Integer> request) {
        try {
            int quantity = request.get("quantity");
            cartService.updateCartItem(itemId, quantity);
            return ResponseEntity.ok(Map.of("message", "Đã cập nhật giỏ hàng!"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/remove/{itemId}")
    public ResponseEntity<?> removeFromCart(@PathVariable String itemId) {
        try {
            cartService.removeFromCart(itemId);
            return ResponseEntity.ok(Map.of("message", "Đã xóa khỏi giỏ hàng!"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clearCart(Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            cartService.clearCart(user);
            return ResponseEntity.ok(Map.of("message", "Đã xóa giỏ hàng!"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/checkout")
    public ResponseEntity<?> checkout(Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            List<CartItem> cartItems = cartService.getCartItems(user);
            Double total = cartService.getCartTotal(user);

            if (cartItems.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Giỏ hàng trống!"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("cartItems", cartItems);
            response.put("total", total);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi tải checkout: " + e.getMessage()));
        }
    }

    @PostMapping("/payment")
    public ResponseEntity<?> payment(@RequestBody Map<String, String> request,
                                    Authentication authentication) {
        String paymentMethod = request.getOrDefault("paymentMethod", "default");
        
        if ("momo".equalsIgnoreCase(paymentMethod)) {
            return processMoMoPayment(authentication);
        }
        
        return processDirectPayment(paymentMethod, authentication);
    }

    @PostMapping("/payment/momo")
    public ResponseEntity<?> processMoMoPayment(Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            List<CartItem> cartItems = cartService.getCartItems(user);
            Double total = cartService.getCartTotal(user);

            if (cartItems.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Giỏ hàng trống!"));
            }

            if (total == null || total <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Số tiền thanh toán không hợp lệ!"));
            }

            String orderId = moMoPaymentService.generateOrderId();
            Long amount = total.longValue();
            String orderInfo = "Thanh toan don hang Tiem Sach - Ma: " + orderId;

            Map<String, Object> momoResponse = moMoPaymentService.createPaymentRequest(orderId, amount, orderInfo);

            if (momoResponse != null && momoResponse.containsKey("resultCode") && 
                Integer.parseInt(String.valueOf(momoResponse.get("resultCode"))) == 0) {
                
                String payUrl = (String) momoResponse.get("payUrl");
                String qrCodeUrl = (String) momoResponse.get("qrCodeUrl");
                
                if (payUrl != null && !payUrl.isEmpty()) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("payUrl", payUrl);
                    response.put("qrCodeUrl", qrCodeUrl);
                    response.put("orderId", orderId);
                    response.put("amount", total);
                    response.put("orderInfo", orderInfo);
                    
                    return ResponseEntity.ok(response);
                } else {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "Không nhận được URL thanh toán từ MoMo"));
                }
            } else {
                String errorMsg = momoResponse != null ? String.valueOf(momoResponse.get("message")) : "Không nhận được phản hồi";
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Lỗi thanh toán: " + errorMsg));
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi hệ thống: " + e.getMessage()));
        }
    }
    @Value("${app.frontend-url}")
    private String frontendUrl;

    @GetMapping("/payment/return")
    public ResponseEntity<Void> paymentReturn(@RequestParam Map<String, String> params) {
        
        String redirectTargetUrl = frontendUrl + "/cart/payment-result";
        
        try {
            String resultCode = params.get("resultCode");
            String message = params.get("message");
            String orderId = params.get("orderId");

            if ("0".equals(resultCode)) {
                String signature = params.get("signature");
                boolean isValidSignature = moMoPaymentService.validatePaymentSignature(signature, params);
                
                if (isValidSignature) {
                    // 1. THÀNH CÔNG
                    return ResponseEntity.status(HttpStatus.FOUND)
                            .location(java.net.URI.create(redirectTargetUrl + "?status=success&orderId=" + orderId))
                            .build();
                } else {
                    // 2. SAI CHỮ KÝ BẢO MẬT
                    String msg = java.net.URLEncoder.encode("Chữ ký bảo mật không hợp lệ", "UTF-8");
                    return ResponseEntity.status(HttpStatus.FOUND)
                            .location(java.net.URI.create(redirectTargetUrl + "?status=failed&message=" + msg + "&orderId=" + orderId))
                            .build();
                }
            } else {
                // 3. THẤT BẠI / BẤM HỦY (resultCode != 0)
                String encodedMessage = java.net.URLEncoder.encode(message != null ? message : "Giao dịch thất bại", "UTF-8");
                return ResponseEntity.status(HttpStatus.FOUND)
                        .location(java.net.URI.create(redirectTargetUrl + "?status=failed&message=" + encodedMessage + "&orderId=" + orderId))
                        .build();
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(java.net.URI.create(redirectTargetUrl + "?status=error"))
                    .build();
        }
    }

    @GetMapping("/payment/status")
    public ResponseEntity<?> checkPaymentStatus(@RequestParam(required = false) String orderId) {
        Map<String, Object> response = new HashMap<>();
        
        if (orderId != null) {
            response.put("success", false);
            response.put("orderId", orderId);
            response.put("message", "Payment status check - implement session logic if needed");
        } else {
            response.put("success", false);
            response.put("message", "Order ID not provided");
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/payment/notify")
    public ResponseEntity<?> paymentNotify(@RequestParam Map<String, String> params) {
        try {
            String signature = params.get("signature");
            boolean isValid = moMoPaymentService.validatePaymentSignature(signature, params);

            if (isValid && "0".equals(params.get("resultCode"))) {
                return ResponseEntity.ok(Map.of("resultCode", 0, "message", "Success"));
            } else {
                return ResponseEntity.ok(Map.of("resultCode", -1, "message", "Invalid signature or failed payment"));
            }
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("resultCode", -1, "message", "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/payment/test-momo")
    public ResponseEntity<?> testMoMoConnection() {
        try {
            String orderId = "TEST_" + System.currentTimeMillis();
            Long amount = 1000L;
            String orderInfo = "Test payment from Tiệm Sách";
            
            Map<String, Object> momoResponse = moMoPaymentService.createPaymentRequest(orderId, amount, orderInfo);
            
            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("test_data", Map.of(
                "orderId", orderId,
                "amount", amount,
                "orderInfo", orderInfo
            ));
            result.put("momo_response", momoResponse);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @PostMapping("/payment/simulate-success")
    public ResponseEntity<?> simulatePaymentSuccess(Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            List<CartItem> cartItems = cartService.getCartItems(user);
            Double total = cartService.getCartTotal(user);
            
            if (cartItems.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "message", "Giỏ hàng trống!"));
            }

            if (!orderService.hasEnoughStock(cartItems)) {
                List<CartItem> outOfStock = orderService.getOutOfStockItems(cartItems);
                StringBuilder msg = new StringBuilder("Các sản phẩm không đủ hàng: ");
                for (CartItem item : outOfStock) {
                    msg.append(item.getBook().getTitle()).append(", ");
                }
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "message", msg.toString()));
            }

            Order order = orderService.createOrderFromCart(user, cartItems, "COD");
            orderService.completePayment(order);
            cartService.clearCart(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Thanh toán thành công!");
            response.put("orderId", order.getOrderCode());
            response.put("orderTotal", total);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "Lỗi thanh toán: " + e.getMessage()));
        }
    }

    @PostMapping("/payment/momo-callback")
    public ResponseEntity<?> processMoMoCallback(@RequestBody Map<String, String> request,
                                                Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            String resultCode = request.get("resultCode");
            
            if (resultCode == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "message", "Thanh toán bị hủy!"));
            }

            if (Integer.parseInt(resultCode) == 0) {
                List<CartItem> cartItems = cartService.getCartItems(user);
                Double total = cartService.getCartTotal(user);
                
                if (cartItems.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("success", false, "message", "Giỏ hàng trống!"));
                }

                if (!orderService.hasEnoughStock(cartItems)) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("success", false, "message", "Sản phẩm không đủ hàng!"));
                }

                Order order = orderService.createOrderFromCart(user, cartItems, "MOMO");
                orderService.completePayment(order);
                cartService.clearCart(user);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Thanh toán MoMo thành công!");
                response.put("orderId", order.getOrderCode());
                response.put("orderTotal", total);
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "message", "Thanh toán MoMo thất bại!"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "Lỗi xử lý callback: " + e.getMessage()));
        }
    }

    @PostMapping("/payment/direct")
    public ResponseEntity<?> processDirectPayment(@RequestBody Map<String, String> request,
                                                  Authentication authentication) {
        String paymentMethod = request.getOrDefault("paymentMethod", "COD");
        return processDirectPayment(paymentMethod, authentication);
    }

    private ResponseEntity<?> processDirectPayment(String paymentMethod, Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            List<CartItem> cartItems = cartService.getCartItems(user);
            Double total = cartService.getCartTotal(user);
            
            if (cartItems.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "message", "Giỏ hàng trống!"));
            }

            if (!orderService.hasEnoughStock(cartItems)) {
                List<CartItem> outOfStock = orderService.getOutOfStockItems(cartItems);
                StringBuilder msg = new StringBuilder("Các sản phẩm không đủ hàng: ");
                for (CartItem item : outOfStock) {
                    msg.append(item.getBook().getTitle()).append(" (còn ").append(item.getBook().getQuantity()).append("), ");
                }
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", msg.toString()));
            }

            Order order = orderService.createOrderFromCart(user, cartItems, paymentMethod);
            orderService.completePayment(order);
            cartService.clearCart(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Thanh toán thành công!");
            response.put("orderId", order.getOrderCode());
            response.put("orderTotal", total);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "Lỗi thanh toán: " + e.getMessage()));
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
        return user.orElseThrow(() -> new RuntimeException("User not found: " + principal));
    }
}
