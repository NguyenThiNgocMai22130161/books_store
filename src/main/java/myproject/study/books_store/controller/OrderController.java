package myproject.study.books_store.controller;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import myproject.study.books_store.model.Order;
import myproject.study.books_store.model.User;
import myproject.study.books_store.service.OrderService;
import myproject.study.books_store.service.UserService;

import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;

    public OrderController(OrderService orderService, UserService userService) {
        this.orderService = orderService;
        this.userService = userService;
    }

    /**
     * Xem lịch sử đơn hàng của user
     */
    @GetMapping
public String listOrders(Model model, Authentication authentication) {
    User user = getUserFromAuthentication(authentication);
    if (user == null) {
        return "redirect:/login";
    }

    List<Order> orders = orderService.getUserOrders(user);
    model.addAttribute("orders", orders);
    model.addAttribute("totalSpent", orderService.getUserTotalSpent(user));
    
    // Thêm các thống kê cần thiết
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
    
    model.addAttribute("totalOrders", orders != null ? orders.size() : 0);
    model.addAttribute("completedCount", completedCount);
    model.addAttribute("pendingCount", pendingCount);
    
    return "order/list";
}

    /**
     * Xem chi tiết đơn hàng
     */
    @GetMapping("/{orderId}")
    public String viewOrder(@PathVariable String orderId, 
                           Model model, 
                           Authentication authentication,
                           RedirectAttributes redirectAttributes) {
        User user = getUserFromAuthentication(authentication);
        if (user == null) {
            return "redirect:/login";
        }

        Optional<Order> orderOpt = orderService.getOrderById(orderId);
        if (orderOpt.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Không tìm thấy đơn hàng!");
            return "redirect:/orders";
        }

        Order order = orderOpt.get();
        // Kiểm tra xem đơn hàng có thuộc về user hiện tại không
        if (!order.getUser().getUserId().equals(user.getUserId())) {
            redirectAttributes.addFlashAttribute("errorMessage", "Bạn không có quyền xem đơn hàng này!");
            return "redirect:/orders";
        }

        model.addAttribute("order", order);
        return "order/detail";
    }

    /**
     * Hủy đơn hàng (chỉ khi đơn hàng chưa hoàn tất)
     */
    @PostMapping("/{orderId}/cancel")
    public String cancelOrder(@PathVariable String orderId,
                             Authentication authentication,
                             RedirectAttributes redirectAttributes) {
        User user = getUserFromAuthentication(authentication);
        if (user == null) {
            return "redirect:/login";
        }

        Optional<Order> orderOpt = orderService.getOrderById(orderId);
        if (orderOpt.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Không tìm thấy đơn hàng!");
            return "redirect:/orders";
        }

        Order order = orderOpt.get();
        // Kiểm tra quyền
        if (!order.getUser().getUserId().equals(user.getUserId())) {
            redirectAttributes.addFlashAttribute("errorMessage", "Bạn không có quyền hủy đơn hàng này!");
            return "redirect:/orders";
        }

        // Chỉ có thể hủy đơn hàng chưa hoàn tất
        if (!order.getStatus().equals("PENDING")) {
            redirectAttributes.addFlashAttribute("errorMessage", "Chỉ có thể hủy đơn hàng chưa hoàn tất!");
            return "redirect:/orders/" + orderId;
        }

        orderService.cancelOrder(orderId);
        redirectAttributes.addFlashAttribute("successMessage", "Hủy đơn hàng thành công!");
        return "redirect:/orders";
    }

    /**
     * Admin: Xem tất cả đơn hàng
     */
    @GetMapping("/admin/all")
    public String adminListAllOrders(Model model) {
        List<Order> orders = orderService.getOrdersByStatus("COMPLETED");
        model.addAttribute("orders", orders);
        model.addAttribute("totalRevenue", orderService.getTotalRevenue());
        return "order/admin-list";
    }

    /**
     * Lấy user từ authentication
     */
    private User getUserFromAuthentication(Authentication authentication) {
        if (authentication == null) {
            return null;
        }

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
        return user.orElse(null);
    }
}
