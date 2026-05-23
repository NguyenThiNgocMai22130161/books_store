package myproject.study.books_store.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import myproject.study.books_store.model.Order;
import myproject.study.books_store.model.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    /**
     * Lấy tất cả đơn hàng của một user
     */
    List<Order> findByUser(User user);
    
    /**
     * Lấy đơn hàng theo mã đơn hàng
     */
    Optional<Order> findByOrderCode(String orderCode);
    
    /**
     * Lấy đơn hàng theo status
     */
    List<Order> findByStatus(String status);
    
    /**
     * Lấy đơn hàng của user theo status
     */
    List<Order> findByUserAndStatus(User user, String status);
    
    List<Order> findByUserUserIdAndStatus(Long userId, String status);
}
