package myproject.study.books_store.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import myproject.study.books_store.dto.*;
import myproject.study.books_store.model.*;
import myproject.study.books_store.repository.BookRepository;
import myproject.study.books_store.repository.OrderRepository;
import myproject.study.books_store.repository.OrderSpecification;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final BookRepository bookRepository;

    public OrderService(OrderRepository orderRepository, BookRepository bookRepository) {
        this.orderRepository = orderRepository;
        this.bookRepository = bookRepository;
    }

    /**
     * Tạo đơn hàng từ giỏ hàng
     */
    public Order createOrderFromCart(User user, List<CartItem> cartItems, String paymentMethod) {
        Order order = new Order(user, paymentMethod);

        // Thêm các item từ giỏ hàng vào đơn hàng
        for (CartItem cartItem : cartItems) {
            OrderItem orderItem = new OrderItem(cartItem.getBook(), cartItem.getQuantity());
            order.addItem(orderItem);
        }

        // Tính tổng giá
        order.calculateTotal();

        // Lưu đơn hàng
        return orderRepository.save(order);
    }

    /**
     * Hoàn tất thanh toán - cập nhật số lượng sách và trạng thái đơn hàng
     */
    public void completePayment(Order order) {

        // =========================
        // CHỐNG THANH TOÁN TRÙNG
        // =========================
        if ("PAID".equals(order.getStatus())) {
            return;
        }

        // =========================
        // TRỪ KHO
        // =========================
        for (OrderItem item : order.getItems()) {

            Book book = item.getBook();

            if (book != null) {

                int currentQuantity =
                        book.getQuantity() != null
                                ? book.getQuantity()
                                : 0;

                // tránh âm kho
                if (currentQuantity < item.getQuantity()) {
                    throw new RuntimeException(
                            "Không đủ số lượng sách trong kho"
                    );
                }

                book.setQuantity(
                        currentQuantity - item.getQuantity()
                );

                bookRepository.save(book);
            }
        }

        // =========================
        // UPDATE ORDER
        // =========================
        order.complete();

        order.setStatus("PAID");

        orderRepository.save(order);
    }
    
    /**
     * Thanh toán thất bại
     */
    public void failPayment(Order order) {

        order.setStatus("FAILED");

        orderRepository.save(order);
    }
    
    /**
     * Hủy đơn hàng
     */
    public void cancelOrder(String orderId) {
        Optional<Order> orderOpt = orderRepository.findById(Long.parseLong(orderId));
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            order.cancel();
            orderRepository.save(order);
        }
    }

    /**
     * Lấy tất cả đơn hàng của user
     */
    public List<Order> getUserOrders(User user) {
        return orderRepository.findByUser(user);
    }

    /**
     * Lấy đơn hàng đã hoàn tất của user
     */
    public List<Order> getCompletedOrders(User user) {
        return orderRepository.findByUserAndStatus(user, "COMPLETED");
    }

    /**
     * Lấy đơn hàng đang chờ xử lý của user
     */
    public List<Order> getPendingOrders(User user) {
        return orderRepository.findByUserAndStatus(user, "PENDING");
    }

    /**
     * Lấy chi tiết đơn hàng
     */
    public Optional<Order> getOrderById(String orderId) {
        return orderRepository.findById(Long.parseLong(orderId));
    }

    /**
     * Lấy đơn hàng theo mã đơn
     */
    public Optional<Order> getOrderByCode(String orderCode) {
        return orderRepository.findByOrderCode(orderCode);
    }

    /**
     * Cập nhật trạng thái đơn hàng
     */
    public Order updateOrderStatus(String orderId, String status) {
        Optional<Order> orderOpt = orderRepository.findById(Long.parseLong(orderId));
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            order.setStatus(status);
            return orderRepository.save(order);
        }
        return null;
    }

    /**
     * Kiểm tra xem đơn hàng có đủ số lượng không
     */
    public boolean hasEnoughStock(List<CartItem> cartItems) {
        for (CartItem item : cartItems) {
            Book book = item.getBook();
            if (book == null) return false;
            
            int availableQuantity = book.getQuantity() != null ? book.getQuantity() : 0;
            if (availableQuantity < item.getQuantity()) {
                return false;
            }
        }
        return true;
    }

    /**
     * Lấy thông tin sách không đủ hàng
     */
    public List<CartItem> getOutOfStockItems(List<CartItem> cartItems) {
        List<CartItem> outOfStock = new java.util.ArrayList<>();
        for (CartItem item : cartItems) {
            Book book = item.getBook();
            if (book != null) {
                int availableQuantity = book.getQuantity() != null ? book.getQuantity() : 0;
                if (availableQuantity < item.getQuantity()) {
                    outOfStock.add(item);
                }
            }
        }
        return outOfStock;
    }

    /**
     * Lấy tất cả đơn hàng theo status
     */
    public List<Order> getOrdersByStatus(String status) {
        return orderRepository.findByStatus(status);
    }

    /**
     * Tính tổng doanh thu
     */
    public Double getTotalRevenue() {
        List<Order> completedOrders = orderRepository.findByStatus("COMPLETED");
        return completedOrders.stream()
                .mapToDouble(Order::getTotalPrice)
                .sum();
    }

    /**
     * Tính tổng doanh thu theo user
     */
    public Double getUserTotalSpent(User user) {
        List<Order> userOrders = orderRepository.findByUserAndStatus(user, "COMPLETED");
        return userOrders.stream()
                .mapToDouble(Order::getTotalPrice)
                .sum();
    }
    
    /**
     * Lưu order
     */
    public Order save(Order order) {
        return orderRepository.save(order);
    }
    
    /**
     * Tìm order theo orderCode
     */
    public Order findByOrderCode(String orderCode) {
        return orderRepository
                .findByOrderCode(orderCode)
                .orElse(null);
    }

    // ============================================
    // ADMIN METHODS
    // ============================================

    /**
     * Admin: Lấy danh sách đơn hàng với filter và pagination
     */
    public Page<AdminOrderSummaryResponse> getAdminOrders(
            String keyword,
            String status,
            String paymentMethod,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable
    ) {
        Specification<Order> spec = OrderSpecification.filterOrders(
                keyword, status, paymentMethod, fromDate, toDate
        );

        Page<Order> orderPage = orderRepository.findAll(spec, pageable);

        return orderPage.map(this::convertToSummaryResponse);
    }

    /**
     * Admin: Lấy chi tiết đơn hàng
     */
    public AdminOrderDetailResponse getAdminOrderDetail(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        return convertToDetailResponse(order);
    }

    /**
     * Admin: Cập nhật trạng thái đơn hàng với validation
     */
    public AdminOrderDetailResponse updateOrderStatusAdmin(Long orderId, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        String currentStatus = order.getStatus();

        // Validate status transition
        if (!isValidStatusTransition(currentStatus, newStatus)) {
            throw new IllegalStateException(
                    String.format("Không thể chuyển đơn hàng từ %s sang %s", currentStatus, newStatus)
            );
        }

        // Hoàn kho nếu hủy đơn PENDING hoặc CONFIRMED
        if ("CANCELLED".equals(newStatus) && 
            ("PENDING".equals(currentStatus) || "CONFIRMED".equals(currentStatus))) {
            restoreStock(order);
        }

        order.setStatus(newStatus);
        order.setUpdatedAt(java.time.LocalDateTime.now());
        orderRepository.save(order);

        return convertToDetailResponse(order);
    }

    /**
     * Admin: Lấy thống kê đơn hàng
     */
    public OrderStatisticsResponse getOrderStatistics() {
        Long totalOrders = orderRepository.countAllOrders();
        Long pendingOrders = orderRepository.countByStatus("PENDING");
        Long confirmedOrders = orderRepository.countByStatus("CONFIRMED");
        Long processingOrders = orderRepository.countByStatus("PROCESSING");
        Long shippingOrders = orderRepository.countByStatus("SHIPPING");
        Long deliveredOrders = orderRepository.countByStatus("DELIVERED");
        Long cancelledOrders = orderRepository.countByStatus("CANCELLED");
        Long paidOrders = orderRepository.countByStatus("PAID");
        Double totalRevenue = orderRepository.calculateTotalRevenue();

        return new OrderStatisticsResponse(
                totalOrders,
                pendingOrders,
                confirmedOrders,
                processingOrders,
                shippingOrders,
                deliveredOrders,
                cancelledOrders,
                paidOrders,
                totalRevenue
        );
    }

    /**
     * Validate status transition theo state machine
     * 
     * Valid transitions:
     * PENDING -> CONFIRMED, CANCELLED
     * CONFIRMED -> PROCESSING, CANCELLED
     * PROCESSING -> SHIPPING
     * SHIPPING -> DELIVERED
     * PAID -> CONFIRMED
     * 
     * Invalid:
     * DELIVERED -> any (final state)
     * CANCELLED -> any (final state)
     * FAILED -> any (final state)
     */
    private boolean isValidStatusTransition(String currentStatus, String newStatus) {
        if (currentStatus == null || newStatus == null) {
            return false;
        }

        // Final states cannot transition
        if ("DELIVERED".equals(currentStatus) || 
            "CANCELLED".equals(currentStatus) || 
            "FAILED".equals(currentStatus)) {
            return false;
        }

        // Same status is ok
        if (currentStatus.equals(newStatus)) {
            return true;
        }

        // Define valid transitions
        switch (currentStatus) {
            case "PENDING":
                return "CONFIRMED".equals(newStatus) || "CANCELLED".equals(newStatus);
            case "CONFIRMED":
                return "PROCESSING".equals(newStatus) || "CANCELLED".equals(newStatus);
            case "PROCESSING":
                return "SHIPPING".equals(newStatus);
            case "SHIPPING":
                return "DELIVERED".equals(newStatus);
            case "PAID":
                return "CONFIRMED".equals(newStatus) || "PROCESSING".equals(newStatus);
            default:
                return false;
        }
    }

    /**
     * Hoàn kho khi hủy đơn
     */
    private void restoreStock(Order order) {
        for (OrderItem item : order.getItems()) {
            Book book = item.getBook();
            if (book != null) {
                int currentQuantity = book.getQuantity() != null ? book.getQuantity() : 0;
                book.setQuantity(currentQuantity + item.getQuantity());
                bookRepository.save(book);
            }
        }
    }

    /**
     * Convert Order entity to summary DTO
     */
    private AdminOrderSummaryResponse convertToSummaryResponse(Order order) {
        User user = order.getUser();
        
        return new AdminOrderSummaryResponse(
                order.getId(),
                order.getOrderCode(),
                user != null ? (user.getFullName() != null ? user.getFullName() : user.getUsername()) : "N/A",
                user != null ? user.getEmail() : "N/A",
                order.getItems() != null ? order.getItems().size() : 0,
                order.getTotalPrice(),
                order.getStatus(),
                order.getPaymentMethod(),
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }

    /**
     * Convert Order entity to detail DTO
     */
    private AdminOrderDetailResponse convertToDetailResponse(Order order) {
        AdminOrderDetailResponse response = new AdminOrderDetailResponse();
        
        response.setId(order.getId());
        response.setOrderCode(order.getOrderCode());
        response.setStatus(order.getStatus());
        response.setPaymentMethod(order.getPaymentMethod());
        response.setTotalAmount(order.getTotalPrice());
        response.setCreatedAt(order.getCreatedAt());
        response.setUpdatedAt(order.getUpdatedAt());

        // Customer info
        User user = order.getUser();
        if (user != null) {
            response.setCustomerId(user.getUserId());
            response.setCustomerName(user.getFullName() != null ? user.getFullName() : user.getUsername());
            response.setCustomerEmail(user.getEmail());
            response.setCustomerUsername(user.getUsername());
        }

        // Items
        List<AdminOrderItemResponse> items = order.getItems().stream()
                .map(this::convertToItemResponse)
                .collect(Collectors.toList());
        response.setItems(items);
        response.setTotalItems(items.size());

        return response;
    }

    /**
     * Convert OrderItem to DTO
     */
    private AdminOrderItemResponse convertToItemResponse(OrderItem item) {
        Book book = item.getBook();
        
        return new AdminOrderItemResponse(
                book != null ? book.getId() : null,
                item.getBookTitle(),
                item.getBookAuthor(),
                book != null ? book.getImageUrl() : null,
                item.getQuantity(),
                item.getPrice(),
                item.getTotalPrice()
        );
    }
}
