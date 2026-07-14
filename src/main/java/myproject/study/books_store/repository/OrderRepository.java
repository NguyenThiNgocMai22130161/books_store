package myproject.study.books_store.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import myproject.study.books_store.model.Order;
import myproject.study.books_store.model.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    
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
    
    /**
     * Đếm đơn hàng theo status
     */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = :status")
    Long countByStatus(@Param("status") String status);
    
    /**
     * Tính tổng doanh thu từ đơn đã hoàn thành (PAID hoặc COMPLETED)
     */
    @Query("SELECT COALESCE(SUM(o.totalPrice), 0.0) FROM Order o WHERE o.status IN ('PAID', 'COMPLETED')")
    Double calculateTotalRevenue();
    
    /**
     * Đếm tất cả đơn hàng
     */
    @Query("SELECT COUNT(o) FROM Order o")
    Long countAllOrders();
}
