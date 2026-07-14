package myproject.study.books_store.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import myproject.study.books_store.dto.*;
import myproject.study.books_store.service.OrderService;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * Admin Order Management Controller
 * Only accessible by users with ROLE_ADMIN
 */
@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderService orderService;

    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * GET /api/admin/orders
     * Lấy danh sách đơn hàng với filter, search và pagination
     * 
     * Query params:
     * - page: số trang (default 0)
     * - size: số items per page (default 10)
     * - keyword: tìm theo mã đơn, tên khách, email
     * - status: lọc theo trạng thái
     * - paymentMethod: lọc theo phương thức thanh toán
     * - fromDate: từ ngày (yyyy-MM-dd)
     * - toDate: đến ngày (yyyy-MM-dd)
     * - sort: sắp xếp (default: createdAt,desc)
     */
    @GetMapping
    public ResponseEntity<?> getOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        try {
            // Validate page and size
            if (page < 0) page = 0;
            if (size < 1 || size > 100) size = 10;

            // Parse sort parameter
            String[] sortParams = sort.split(",");
            String sortField = sortParams[0];
            String sortDirection = sortParams.length > 1 ? sortParams[1] : "desc";

            // Whitelist sort fields to prevent SQL injection
            if (!isValidSortField(sortField)) {
                sortField = "createdAt";
            }

            Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection) 
                    ? Sort.Direction.ASC 
                    : Sort.Direction.DESC;

            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));

            // Validate date range
            if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Ngày bắt đầu không thể sau ngày kết thúc"
                ));
            }

            Page<AdminOrderSummaryResponse> orderPage = orderService.getAdminOrders(
                    keyword, status, paymentMethod, fromDate, toDate, pageable
            );

            Map<String, Object> response = new HashMap<>();
            response.put("content", orderPage.getContent());
            response.put("page", orderPage.getNumber());
            response.put("size", orderPage.getSize());
            response.put("totalElements", orderPage.getTotalElements());
            response.put("totalPages", orderPage.getTotalPages());
            response.put("last", orderPage.isLast());
            response.put("first", orderPage.isFirst());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi tải danh sách đơn hàng: " + e.getMessage()));
        }
    }

    /**
     * GET /api/admin/orders/{orderId}
     * Lấy chi tiết đơn hàng
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<?> getOrderDetail(@PathVariable Long orderId) {
        try {
            AdminOrderDetailResponse orderDetail = orderService.getAdminOrderDetail(orderId);
            return ResponseEntity.ok(orderDetail);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi tải chi tiết đơn hàng: " + e.getMessage()));
        }
    }

    /**
     * PATCH /api/admin/orders/{orderId}/status
     * Cập nhật trạng thái đơn hàng
     * 
     * Request body:
     * {
     *   "status": "CONFIRMED"
     * }
     */
    @PatchMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody UpdateOrderStatusRequest request
    ) {
        try {
            // Validate request
            if (request.getStatus() == null || request.getStatus().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Trạng thái không được để trống"));
            }

            // Validate status value
            String newStatus = request.getStatus().trim().toUpperCase();
            if (!isValidStatus(newStatus)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Trạng thái không hợp lệ: " + newStatus));
            }

            AdminOrderDetailResponse updatedOrder = orderService.updateOrderStatusAdmin(orderId, newStatus);
            
            return ResponseEntity.ok(Map.of(
                    "message", "Cập nhật trạng thái đơn hàng thành công",
                    "order", updatedOrder
            ));

        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi cập nhật trạng thái: " + e.getMessage()));
        }
    }

    /**
     * GET /api/admin/orders/statistics
     * Lấy thống kê đơn hàng
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getStatistics() {
        try {
            OrderStatisticsResponse statistics = orderService.getOrderStatistics();
            return ResponseEntity.ok(statistics);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi tải thống kê: " + e.getMessage()));
        }
    }

    /**
     * Validate sort field whitelist
     */
    private boolean isValidSortField(String field) {
        return field != null && (
                field.equals("id") ||
                field.equals("orderCode") ||
                field.equals("totalPrice") ||
                field.equals("status") ||
                field.equals("createdAt") ||
                field.equals("updatedAt")
        );
    }

    /**
     * Validate status enum
     */
    private boolean isValidStatus(String status) {
        return status != null && (
                status.equals("PENDING") ||
                status.equals("CONFIRMED") ||
                status.equals("PROCESSING") ||
                status.equals("SHIPPING") ||
                status.equals("DELIVERED") ||
                status.equals("CANCELLED") ||
                status.equals("PAID") ||
                status.equals("FAILED")
        );
    }
}
