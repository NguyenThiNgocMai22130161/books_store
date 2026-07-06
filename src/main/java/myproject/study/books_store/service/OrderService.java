package myproject.study.books_store.service;

import org.springframework.stereotype.Service;

import myproject.study.books_store.model.*;
import myproject.study.books_store.repository.BookRepository;
import myproject.study.books_store.repository.OrderRepository;

import java.util.List;
import java.util.Optional;

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
    /**
     * Hoàn tất thanh toán
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
}
