package myproject.study.books_store.controller;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

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

@Controller
@RequestMapping("/cart")
public class CartController {

    private final CartService cartService;
    private final MoMoPaymentService moMoPaymentService;
    private final UserService userService;
    private final OrderService orderService;

    public CartController(CartService cartService, MoMoPaymentService moMoPaymentService, UserService userService, OrderService orderService) {
        this.cartService = cartService;
        this.moMoPaymentService = moMoPaymentService;
        this.userService = userService;
        this.orderService = orderService;
    }

    @GetMapping
    public String viewCart(Model model, Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        List<CartItem> cartItems = cartService.getCartItems(user);
        Double total = cartService.getCartTotal(user);
        int itemCount = cartService.getCartItemCount(user);

        model.addAttribute("cartItems", cartItems);
        model.addAttribute("total", total);
        model.addAttribute("itemCount", itemCount);
        return "cart/list";
    }

    @PostMapping("/add")
    public String addToCart(@RequestParam String bookId,
                           @RequestParam(defaultValue = "1") int quantity,
                           RedirectAttributes redirectAttributes,
                           Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            
            // Kiểm tra xem user là admin thì không cho thêm vào giỏ
            if (user.isAdmin()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Tài khoản admin không thể thêm sách vào giỏ hàng!");
                return "redirect:/books";
            }
            
            cartService.addToCart(user, bookId, quantity);
            redirectAttributes.addFlashAttribute("successMessage", "Đã thêm vào giỏ hàng!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/books";
    }

    @PostMapping("/add/{bookId}")
    public String addToCartFromBookDetail(@PathVariable String bookId,
                                          @RequestParam(defaultValue = "1") int quantity,
                                          RedirectAttributes redirectAttributes,
                                          Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            
            // Kiểm tra xem user là admin thì không cho thêm vào giỏ
            if (user.isAdmin()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Tài khoản admin không thể thêm sách vào giỏ hàng!");
                return "redirect:/books/view/" + bookId;
            }
            
            cartService.addToCart(user, bookId, quantity);
            redirectAttributes.addFlashAttribute("successMessage", "Đã thêm vào giỏ hàng!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/cart";
    }

    @PostMapping("/update")
    public String updateCart(@RequestParam String itemId,
                            @RequestParam int quantity,
                            RedirectAttributes redirectAttributes,
                            Authentication authentication) {
        try {
            cartService.updateCartItem(itemId, quantity);
            redirectAttributes.addFlashAttribute("successMessage", "Đã cập nhật giỏ hàng!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/cart";
    }

    @GetMapping("/remove/{itemId}")
    public String removeFromCart(@PathVariable String itemId,
                                 RedirectAttributes redirectAttributes,
                                 Authentication authentication) {
        try {
            cartService.removeFromCart(itemId);
            redirectAttributes.addFlashAttribute("successMessage", "Đã xóa khỏi giỏ hàng!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/cart";
    }

    @GetMapping("/clear")
    public String clearCart(RedirectAttributes redirectAttributes,
                          Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            cartService.clearCart(user);
            redirectAttributes.addFlashAttribute("successMessage", "Đã xóa giỏ hàng!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/cart";
    }

    @GetMapping("/checkout")
    public String checkout(Model model, Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        List<CartItem> cartItems = cartService.getCartItems(user);
        Double total = cartService.getCartTotal(user);

        if (cartItems.isEmpty()) {
            return "redirect:/cart";
        }

        model.addAttribute("cartItems", cartItems);
        model.addAttribute("total", total);
        return "cart/checkout";
    }

    /**
     * Xử lý form thanh toán từ checkout page
     * Điều hướng đến MoMo hoặc thanh toán trực tiếp dựa vào lựa chọn của người dùng
     */
    @PostMapping("/payment")
    public String payment(@RequestParam(defaultValue = "default") String paymentMethod,
                         Model model,
                         RedirectAttributes redirectAttributes,
                         Authentication authentication) {
        
        // Nếu chọn MoMo
        if ("momo".equalsIgnoreCase(paymentMethod)) {
            return processMoMoPayment(model, authentication);
        }
        
        // Nếu chọn mặc định hoặc các phương thức khác
        return processDirectPayment(paymentMethod, redirectAttributes, authentication);
    }

    @PostMapping("/payment/momo")
public String processMoMoPayment(Model model,
                                Authentication authentication) {
    try {
        User user = getUserFromAuthentication(authentication);
        List<CartItem> cartItems = cartService.getCartItems(user);
        Double total = cartService.getCartTotal(user);

        if (cartItems.isEmpty()) {
            model.addAttribute("errorMessage", "Giỏ hàng trống!");
            return "redirect:/cart";
        }

        if (total == null || total <= 0) {
            model.addAttribute("errorMessage", "Số tiền thanh toán không hợp lệ!");
            return "redirect:/cart/checkout";
        }

        String orderId = moMoPaymentService.generateOrderId();
        
        // QUAN TRỌNG: MoMo yêu cầu amount tính bằng VND và là integer
        // Nếu giá sách của bạn đã là VND, nhân với 100
        // Nếu giá sách của bạn là đơn vị khác (ví dụ: nghìn VND), điều chỉnh cho phù hợp
        Long amount = (long) (total * 100); // Chuyển từ double sang long và nhân 100
        
        System.out.println("Total from cart: " + total);
        System.out.println("Amount for MoMo: " + amount);
        System.out.println("Order ID: " + orderId);
        
        String orderInfo = "Thanh toán đơn hàng Tiệm Sách - Mã: " + orderId;

        Map<String, Object> response = moMoPaymentService.createPaymentRequest(orderId, amount, orderInfo);
        
        System.out.println("MoMo response: " + response); // Debug

        if (response != null && response.containsKey("resultCode") && 
            Integer.parseInt(String.valueOf(response.get("resultCode"))) == 0) {
            
            String payUrl = (String) response.get("payUrl");
            String qrCodeUrl = (String) response.get("qrCodeUrl");
            
            if (payUrl != null && !payUrl.isEmpty()) {
                System.out.println("Payment URL: " + payUrl);
                System.out.println("QR Code URL: " + qrCodeUrl);
                
                // Lưu thông tin đơn hàng vào session
                jakarta.servlet.http.HttpServletRequest request = 
                    ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
                request.getSession().setAttribute("momo_order_" + orderId, true);
                request.getSession().setAttribute("momo_amount", amount);
                request.getSession().setAttribute("momo_cart_items", cartItems);
                request.getSession().setAttribute("momo_order_id", orderId);
                
                // Truyền dữ liệu QR code đến template
                model.addAttribute("payUrl", payUrl);
                model.addAttribute("qrCodeUrl", qrCodeUrl);
                model.addAttribute("orderId", orderId);
                model.addAttribute("amount", total);
                model.addAttribute("orderInfo", orderInfo);
                
                return "cart/momo-payment";
            } else {
                model.addAttribute("errorMessage", "Không nhận được URL thanh toán từ MoMo");
                return "redirect:/cart/checkout";
            }
        } else {
            String errorMsg = response != null ? String.valueOf(response.get("message")) : "Không nhận được phản hồi";
            model.addAttribute("errorMessage", "Lỗi thanh toán: " + errorMsg);
            return "redirect:/cart/checkout";
        }

    } catch (Exception e) {
        e.printStackTrace();
        model.addAttribute("errorMessage", "Lỗi hệ thống: " + e.getMessage());
        return "redirect:/cart/checkout";
    }
}

    @GetMapping("/payment/return")
    public String paymentReturn(@RequestParam Map<String, String> params,
                               Model model,
                               RedirectAttributes redirectAttributes,
                               Authentication authentication) {
        try {
            System.out.println("=== MOMO PAYMENT RETURN ===");
            System.out.println("All params: " + params);
            
            User user = getUserFromAuthentication(authentication);
            String resultCode = params.get("resultCode");
            String message = params.get("message");
            String orderId = params.get("orderId");
            
            System.out.println("Result Code: " + resultCode);
            System.out.println("Message: " + message);
            System.out.println("Order ID: " + orderId);

            jakarta.servlet.http.HttpServletRequest request = 
                ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            jakarta.servlet.http.HttpSession session = request.getSession();

            if ("0".equals(resultCode)) {
                // Validate signature
                String signature = params.get("signature");
                boolean isValidSignature = moMoPaymentService.validatePaymentSignature(signature, params);
                System.out.println("Signature valid: " + isValidSignature);
                
                if (isValidSignature) {
                    cartService.clearCart(user);
                    session.setAttribute("momo_payment_" + orderId, true);
                    redirectAttributes.addFlashAttribute("success", true);
                    redirectAttributes.addFlashAttribute("message", "Thanh toán thành công!");
                    redirectAttributes.addFlashAttribute("orderId", orderId);
                } else {
                    session.setAttribute("momo_payment_" + orderId, false);
                    redirectAttributes.addFlashAttribute("success", false);
                    redirectAttributes.addFlashAttribute("message", "Signature không hợp lệ!");
                    redirectAttributes.addFlashAttribute("orderId", orderId);
                }
                return "redirect:/cart/payment/result";
            } else {
                session.setAttribute("momo_payment_" + orderId, false);
                redirectAttributes.addFlashAttribute("success", false);
                redirectAttributes.addFlashAttribute("message", "Thanh toán thất bại: " + message);
                redirectAttributes.addFlashAttribute("orderId", orderId);
                return "redirect:/cart/payment/result";
            }

        } catch (Exception e) {
            System.err.println("Error in payment return: " + e.getMessage());
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi: " + e.getMessage());
            return "redirect:/cart/payment/result";
        }
    }

    @GetMapping("/payment/status")
    @ResponseBody
    public Map<String, Object> checkPaymentStatus(@RequestParam(required = false) String orderId,
                                                   jakarta.servlet.http.HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        
        if (orderId != null) {
            // Kiểm tra session để xem thanh toán đã hoàn thành hay chưa
            Object paymentResult = session.getAttribute("momo_payment_" + orderId);
            
            if (paymentResult != null && (Boolean) paymentResult) {
                response.put("success", true);
                response.put("orderId", orderId);
            } else {
                response.put("success", false);
                response.put("orderId", orderId);
            }
        } else {
            response.put("success", false);
            response.put("message", "Order ID not provided");
        }
        
        return response;
    }

    @GetMapping("/payment/result")
    public String paymentResult(Model model) {
        // Flash attributes sẽ tự động được chuyển từ redirect trước đó
        // Add debug mode for development
        model.addAttribute("debug", true);
        return "cart/payment-result";
    }

    @GetMapping("/payment/notify")
    @ResponseBody
    public String paymentNotify(@RequestParam Map<String, String> params) {
        try {
            String signature = params.get("signature");
            boolean isValid = moMoPaymentService.validatePaymentSignature(signature, params);

            if (isValid && "0".equals(params.get("resultCode"))) {
                return "{\"resultCode\":0,\"message\":\"Success\"}";
            } else {
                return "{\"resultCode\":-1,\"message\":\"Invalid signature or failed payment\"}";
            }
        } catch (Exception e) {
            return "{\"resultCode\":-1,\"message\":\"Error: " + e.getMessage() + "\"}";
        }
    }

    private User getUserFromAuthentication(Authentication authentication) {
        // Handle OAuth2 users
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
        
        // Handle regular users
        String principal = authentication.getName();
        Optional<User> user = userService.findByUsername(principal);
        if (user.isEmpty()) {
            user = userService.findByEmail(principal);
        }
        return user.orElseThrow(() -> new RuntimeException("User not found: " + principal));
    }
    @GetMapping("/payment/test-momo")
    @ResponseBody
    public Map<String, Object> testMoMoConnection() {
        try {
            System.out.println("=== TESTING MOMO CONNECTION ===");
            
            // Test với số tiền nhỏ
            String orderId = "TEST_" + System.currentTimeMillis();
            Long amount = 1000L; // 10 VND (đã nhân 100)
            String orderInfo = "Test payment from Tiệm Sách";
            
            Map<String, Object> response = moMoPaymentService.createPaymentRequest(orderId, amount, orderInfo);
            
            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("test_data", Map.of(
                "orderId", orderId,
                "amount", amount,
                "orderInfo", orderInfo
            ));
            result.put("momo_response", response);
            
            return result;
            
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("status", "error");
            result.put("message", e.getMessage());
            return result;
        }
    }

    @GetMapping("/payment/simulate-success")
    public String simulatePaymentSuccess(Authentication authentication, RedirectAttributes redirectAttributes) {
        try {
            User user = getUserFromAuthentication(authentication);
            List<CartItem> cartItems = cartService.getCartItems(user);
            Double total = cartService.getCartTotal(user);
            
            if (cartItems.isEmpty()) {
                redirectAttributes.addFlashAttribute("success", false);
                redirectAttributes.addFlashAttribute("message", "Giỏ hàng trống!");
                return "redirect:/cart/payment/result";
            }

            // Kiểm tra stock
            if (!orderService.hasEnoughStock(cartItems)) {
                List<CartItem> outOfStock = orderService.getOutOfStockItems(cartItems);
                StringBuilder msg = new StringBuilder("Các sản phẩm không đủ hàng: ");
                for (CartItem item : outOfStock) {
                    msg.append(item.getBook().getTitle()).append(", ");
                }
                redirectAttributes.addFlashAttribute("success", false);
                redirectAttributes.addFlashAttribute("message", msg.toString());
                return "redirect:/cart/payment/result";
            }

            // Tạo đơn hàng
            Order order = orderService.createOrderFromCart(user, cartItems, "COD");
            
            // Hoàn tất thanh toán (trừ hàng, cập nhật trạng thái)
            orderService.completePayment(order);
            
            // Xóa giỏ hàng
            cartService.clearCart(user);
            
            redirectAttributes.addFlashAttribute("success", true);
            redirectAttributes.addFlashAttribute("message", "Thanh toán thành công!");
            redirectAttributes.addFlashAttribute("orderId", order.getOrderCode());
            redirectAttributes.addFlashAttribute("orderTotal", total);
            
            return "redirect:/cart/payment/result";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("success", false);
            redirectAttributes.addFlashAttribute("message", "Lỗi thanh toán: " + e.getMessage());
            return "redirect:/cart/payment/result";
        }
    }

    /**
     * Xử lý callback từ MoMo sau khi thanh toán
     */
    @PostMapping("/payment/momo-callback")
    public String processMoMoCallback(@RequestParam(required = false) String orderId,
                                     @RequestParam(required = false) String resultCode,
                                     RedirectAttributes redirectAttributes,
                                     Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            
            if (resultCode == null) {
                redirectAttributes.addFlashAttribute("success", false);
                redirectAttributes.addFlashAttribute("message", "Thanh toán bị hủy!");
                return "redirect:/cart/payment/result";
            }

            // resultCode = 0 là thanh toán thành công
            if (Integer.parseInt(resultCode) == 0) {
                List<CartItem> cartItems = cartService.getCartItems(user);
                Double total = cartService.getCartTotal(user);
                
                if (cartItems.isEmpty()) {
                    redirectAttributes.addFlashAttribute("success", false);
                    redirectAttributes.addFlashAttribute("message", "Giỏ hàng trống!");
                    return "redirect:/cart/payment/result";
                }

                // Kiểm tra stock
                if (!orderService.hasEnoughStock(cartItems)) {
                    redirectAttributes.addFlashAttribute("success", false);
                    redirectAttributes.addFlashAttribute("message", "Sản phẩm không đủ hàng!");
                    return "redirect:/cart/payment/result";
                }

                // Tạo đơn hàng
                Order order = orderService.createOrderFromCart(user, cartItems, "MOMO");
                
                // Hoàn tất thanh toán
                orderService.completePayment(order);
                
                // Xóa giỏ hàng
                cartService.clearCart(user);
                
                redirectAttributes.addFlashAttribute("success", true);
                redirectAttributes.addFlashAttribute("message", "Thanh toán MoMo thành công!");
                redirectAttributes.addFlashAttribute("orderId", order.getOrderCode());
                redirectAttributes.addFlashAttribute("orderTotal", total);
                
                return "redirect:/cart/payment/result";
            } else {
                redirectAttributes.addFlashAttribute("success", false);
                redirectAttributes.addFlashAttribute("message", "Thanh toán MoMo thất bại!");
                return "redirect:/cart/payment/result";
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("success", false);
            redirectAttributes.addFlashAttribute("message", "Lỗi xử lý callback: " + e.getMessage());
            return "redirect:/cart/payment/result";
        }
    }

    /**
     * Thanh toán trực tiếp (không qua MoMo)
     */
    @PostMapping("/payment/direct")
    public String processDirectPayment(@RequestParam String paymentMethod,
                                      RedirectAttributes redirectAttributes,
                                      Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            List<CartItem> cartItems = cartService.getCartItems(user);
            Double total = cartService.getCartTotal(user);
            
            if (cartItems.isEmpty()) {
                redirectAttributes.addFlashAttribute("success", false);
                redirectAttributes.addFlashAttribute("message", "Giỏ hàng trống!");
                return "redirect:/cart";
            }

            // Kiểm tra stock
            if (!orderService.hasEnoughStock(cartItems)) {
                List<CartItem> outOfStock = orderService.getOutOfStockItems(cartItems);
                StringBuilder msg = new StringBuilder("Các sản phẩm không đủ hàng: ");
                for (CartItem item : outOfStock) {
                    msg.append(item.getBook().getTitle()).append(" (còn ").append(item.getBook().getQuantity()).append("), ");
                }
                redirectAttributes.addFlashAttribute("errorMessage", msg.toString());
                return "redirect:/cart/checkout";
            }

            // Tạo đơn hàng
            Order order = orderService.createOrderFromCart(user, cartItems, paymentMethod);
            
            // Hoàn tất thanh toán (trừ hàng, cập nhật trạng thái)
            orderService.completePayment(order);
            
            // Xóa giỏ hàng
            cartService.clearCart(user);
            
            redirectAttributes.addFlashAttribute("success", true);
            redirectAttributes.addFlashAttribute("message", "Thanh toán thành công!");
            redirectAttributes.addFlashAttribute("orderId", order.getOrderCode());
            redirectAttributes.addFlashAttribute("orderTotal", total);
            
            return "redirect:/cart/payment/result";
        } catch (Exception e) {
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("success", false);
            redirectAttributes.addFlashAttribute("message", "Lỗi thanh toán: " + e.getMessage());
            return "redirect:/cart/checkout";
        }
    }
}
