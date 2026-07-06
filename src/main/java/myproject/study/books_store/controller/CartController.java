package myproject.study.books_store.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import myproject.study.books_store.model.CartItem;
import myproject.study.books_store.model.Order;
import myproject.study.books_store.model.User;
import myproject.study.books_store.service.CartService;
import myproject.study.books_store.service.MoMoPaymentService;
import myproject.study.books_store.service.OrderService;
import myproject.study.books_store.service.UserService;
import myproject.study.books_store.service.VNPayService;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import java.net.URLEncoder;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final UserService userService;
    private final OrderService orderService;

    @Autowired
    private VNPayService vnpayService;

    @Value("${app.frontend-url}")
    private String frontendUrl;
    
    public CartController(CartService cartService, UserService userService, 
                        OrderService orderService, VNPayService vnpayService) {
        this.cartService = cartService;
        this.userService = userService;
        this.orderService = orderService;
        this.vnpayService = vnpayService;
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
                                     Authentication authentication,
                                     HttpServletRequest httpRequest) {
        String paymentMethod = request.getOrDefault("paymentMethod", "default");
        if ("vnpay".equalsIgnoreCase(paymentMethod)) {
            return processVNPayPayment(authentication, httpRequest);
        }
        return processDirectPayment(paymentMethod, authentication);
    }

    private ResponseEntity<?> processVNPayPayment(Authentication authentication, HttpServletRequest httpRequest) {
        try {
            User user = getUserFromAuthentication(authentication);
            List<CartItem> cartItems = cartService.getCartItems(user);
            Double total = cartService.getCartTotal(user);

            if (cartItems.isEmpty() || total == null || total <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Giỏ hàng không hợp lệ!"));
            }
            if (!orderService.hasEnoughStock(cartItems)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Sản phẩm không đủ hàng trong kho!"));
            }

            // TẠO MÃ GIAO DỊCH TẠM THỜI (Chứa username để khi gọi lại biết của ai)
            String txnRef = "VNPAY_" + user.getUserId() + "_" + System.currentTimeMillis();

            // Tạo Payment URL từ Service bằng mã giao dịch tạm thời này
            String ipAddr = getIpAddress(httpRequest);
            Map<String, Object> vnpayResponse = vnpayService.createPaymentRequest(total, ipAddr, txnRef);

            Map<String, Object> response = new HashMap<>();
            response.put("paymentUrl", vnpayResponse.get("paymentUrl"));
            response.put("orderId", txnRef); // Trả về mã tạm thời cho Front-end theo dõi
            response.put("amount", total);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace(); // In ra console để bạn dễ debug
            String errorMsg = e.getMessage() != null ? e.getMessage() : "Lỗi hệ thống nội bộ không xác định";
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", errorMsg));
        }
    }

    // =========================================================================
    // 1. VNPAY RETURN URL: Chỉ lấy tham số thô và chuyển tiếp qua Service
    // =========================================================================
    @GetMapping("/payment/vnpay-return")
    public void handleVNPayReturn(HttpServletRequest httpRequest, HttpServletResponse response) throws IOException {
        try {
            Map<String, String> fields = new HashMap<>();
            Map<String, String[]> parameterMap = httpRequest.getParameterMap();
            for (Map.Entry<String, String[]> entry : parameterMap.entrySet()) {
                String key = entry.getKey();
                String value = entry.getValue()[0]; // Lấy giá trị đầu tiên
                if (value != null && !value.isEmpty()) {
                    fields.put(key, value);
                }
            }

            String txnRef = httpRequest.getParameter("vnp_TxnRef"); // Mã giao dịch tạm thời dạng TXN_username_timestamp
            String responseCode = httpRequest.getParameter("vnp_ResponseCode");
            System.out.println("-> Mã reponse: " + responseCode);
            String vnp_SecureHash = httpRequest.getParameter("vnp_SecureHash");
            fields.put("vnp_SecureHash", vnp_SecureHash);

            String transactionStatus = "fail";
            String message = "Thanh toán thất bại hoặc phiên giao dịch bị hủy.";

            boolean isSignatureValid = vnpayService.validatePaymentSignature(fields);
            System.out.println("-> Chữ ký hợp lệ: " + isSignatureValid);
            if (isSignatureValid) {
                if ("00".equals(responseCode)) {
                    // PHÂN TÍCH USERNAME TỪ TXN_REF
                    String[] parts = txnRef.split("_");
                    String username = parts[1];
                    Optional<User> userOpt = userService.findByUsername(username);
                    if (userOpt.isEmpty()) { userOpt = userService.findByEmail(username); }
                    if (userOpt.isEmpty()) {
                        try {
                            userOpt = userService.findById(Long.parseLong(username));
                        } catch (NumberFormatException ignored) {}
                    }
                    
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        
                        // CHỐNG TRÙNG LẶP: Kiểm tra xem IPN đã tạo đơn hàng này trước đó chưa
                        Order existingOrder = orderService.findByOrderCode(txnRef);
                        if (existingOrder == null) {
                            List<CartItem> cartItems = cartService.getCartItems(user);
                            
                            if (!cartItems.isEmpty() && orderService.hasEnoughStock(cartItems)) {
                                // TIẾN HÀNH TẠO ĐƠN HÀNG THẬT VÀO DATABASE
                                Order order = orderService.createOrderFromCart(user, cartItems, "vnpay");
                                order.setOrderCode(txnRef); // Ép mã đơn hàng trùng với mã giao dịch để dễ đối chiếu
                                order.setStatus("PAID");
                                orderService.save(order);
                                
                                orderService.completePayment(order);
                                cartService.clearCart(user); // Xóa giỏ hàng thành công
                                
                                transactionStatus = "success";
                                message = "Thanh toán thành công! Đơn hàng đã được ghi nhận.";
                            } else {
                                transactionStatus = "fail";
                                message = "Thanh toán thành công nhưng sản phẩm trong kho đã hết hoặc giỏ hàng trống.";
                            }
                        } else {
                            // Đơn hàng đã được tạo thành công bởi IPN trước đó
                            transactionStatus = "success";
                            message = "Thanh toán thành công! Đơn hàng đang xử lý.";
                        }
                    }
                } else if ("24".equals(responseCode)) {
                    transactionStatus = "cancel";
                    message = "Khách hàng đã hủy giao dịch thanh toán.";
                }
            } else {
                transactionStatus = "invalid_signature";
                message = "Chữ ký số không hợp lệ. Giao dịch bị can thiệp.";
            }

            String frontendRedirectUrl = frontendUrl + "/cart/payment-result"
                    + "?status=" + transactionStatus
                    + "&orderId=" + txnRef
                    + "&paymentMethod=vnpay"
                    + "&message=" + URLEncoder.encode(message, StandardCharsets.UTF_8.toString());

            response.sendRedirect(frontendRedirectUrl);

        } catch (Exception e) {
            e.printStackTrace();
            response.sendRedirect(frontendUrl + "/cart/payment-result?status=error&message=" 
                    + URLEncoder.encode("Có lỗi hệ thống xảy ra.", StandardCharsets.UTF_8.toString()));
        }
    }

    // =========================================================================
    // 2. VNPAY IPN URL: ĐỒNG BỘ ĐẨY DỮ LIỆU THÔ QUA SERVICE
    // =========================================================================
    @GetMapping("/payment/vnpay-ipn")
    public ResponseEntity<?> handleVNPayIPN(HttpServletRequest httpRequest) {
        try {
            System.out.println("\n========== >>> ĐÃ NHẬN REQUEST TỪ VNPAY IPN <<< ==========");
            System.out.println("-> [IPN] vnp_ResponseCode: " + httpRequest.getParameter("vnp_ResponseCode"));
            System.out.println("-> [IPN] vnp_TxnRef: " + httpRequest.getParameter("vnp_TxnRef"));
            System.out.println("-> [IPN] vnp_Amount: " + httpRequest.getParameter("vnp_Amount"));
            Map<String, String> fields = new HashMap<>();
            Map<String, String[]> parameterMap = httpRequest.getParameterMap();
            for (Map.Entry<String, String[]> entry : parameterMap.entrySet()) {
                String key = entry.getKey();
                String value = entry.getValue()[0];
                if (value != null && !value.isEmpty()) {
                    fields.put(key, value);
                }
            }

            String txnRef = httpRequest.getParameter("vnp_TxnRef");
            String responseCode = httpRequest.getParameter("vnp_ResponseCode");
            String vnpAmount = httpRequest.getParameter("vnp_Amount");
            String vnp_SecureHash = httpRequest.getParameter("vnp_SecureHash");
            fields.put("vnp_SecureHash", vnp_SecureHash);

            // 1. Kiểm tra chữ ký
            if (!vnpayService.validatePaymentSignature(fields)) {
                return ResponseEntity.ok(Map.of("RspCode", "97", "Message", "Invalid Signature"));
            }

            // Phân tích thông tin User từ mã giao dịch tạm thời
            String[] parts = txnRef.split("_");
            if (parts.length < 2) return ResponseEntity.ok(Map.of("RspCode", "01", "Message", "Order not found"));
            String username = parts[1];
            Optional<User> userOpt = userService.findByUsername(username);
            if (userOpt.isEmpty()) { userOpt = userService.findByEmail(username); }
            if (userOpt.isEmpty()) {
                try {
                    userOpt = userService.findById(Long.parseLong(username));
                } catch (NumberFormatException ignored) {}
            }
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of("RspCode", "01", "Message", "User not found"));
            }
            User user = userOpt.get();

            // 2. Kiểm tra trùng lặp (Kiểm tra xem đơn hàng đã được khởi tạo chưa)
            Order order = orderService.findByOrderCode(txnRef);

            if ("00".equals(responseCode)) {
                if (order != null) {
                    // Nếu đơn hàng đã tồn tại (do Return URL tạo trước hoặc IPN gọi lại lần 2)
                    return ResponseEntity.ok(Map.of("RspCode", "02", "Message", "Order already confirmed"));
                }

                List<CartItem> cartItems = cartService.getCartItems(user);
                Double total = cartService.getCartTotal(user);

                if (cartItems.isEmpty()) {
                    return ResponseEntity.ok(Map.of("RspCode", "04", "Message", "Cart is empty"));
                }

                // 3. Kiểm tra số tiền (Tránh trường hợp người dùng sửa đổi giỏ hàng khi đang thanh toán)
                long expectedAmount = Math.round(total * 100);
                long paidAmount = Long.parseLong(vnpAmount);
                if (expectedAmount != paidAmount) {
                    return ResponseEntity.ok(Map.of("RspCode", "04", "Message", "Invalid Amount"));
                }

                if (!orderService.hasEnoughStock(cartItems)) {
                    return ResponseEntity.ok(Map.of("RspCode", "99", "Message", "Out of stock"));
                }

                // 4. Khởi tạo đơn hàng PAID chính thức vào DB
                Order newOrder = orderService.createOrderFromCart(user, cartItems, "vnpay");
                newOrder.setOrderCode(txnRef); // Đồng bộ mã đơn hàng bằng mã giao dịch tạm thời ban đầu
                newOrder.setStatus("PAID");
                orderService.save(newOrder);

                orderService.completePayment(newOrder);
                cartService.clearCart(user);

                return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm success"));
            } else {
                // Nếu VNPay báo thanh toán thất bại, không cần lưu vết đơn hàng (hoặc lưu tùy nhu cầu bạn)
                if (order != null) {
                    return ResponseEntity.ok(Map.of("RspCode", "02", "Message", "Order already processed"));
                }
                return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Transaction failure recorded"));
            }

        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("RspCode", "99", "Message", "Unknown error"));
        }
    }

    // Các hàm bổ trợ (processDirectPayment, getIpAddress, getUserFromAuthentication) giữ nguyên...
    private ResponseEntity<?> processDirectPayment(String paymentMethod, Authentication authentication) {
        // Luồng cũ giữ nguyên
        return ResponseEntity.ok().build(); 
    }

    private String getIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-FORWARDED-FOR");
        String ipAddress = (xForwardedFor != null && !xForwardedFor.isEmpty()) ? xForwardedFor.split(",")[0].trim() : request.getRemoteAddr();
        if (ipAddress == null || "0:0:0:0:0:0:0:1".equals(ipAddress) || "::1".equals(ipAddress)) {
            ipAddress = "127.0.0.1";
        }
        return ipAddress;
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
