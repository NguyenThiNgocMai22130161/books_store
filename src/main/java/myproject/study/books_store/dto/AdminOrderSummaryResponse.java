package myproject.study.books_store.dto;

import java.time.LocalDateTime;

/**
 * DTO for admin order list - lightweight summary
 */
public class AdminOrderSummaryResponse {
    
    private Long id;
    private String orderCode;
    private String customerName;
    private String customerEmail;
    private Integer itemCount;
    private Double totalAmount;
    private String status;
    private String paymentMethod;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AdminOrderSummaryResponse() {}

    public AdminOrderSummaryResponse(Long id, String orderCode, String customerName, 
                                    String customerEmail, Integer itemCount, 
                                    Double totalAmount, String status, 
                                    String paymentMethod, LocalDateTime createdAt, 
                                    LocalDateTime updatedAt) {
        this.id = id;
        this.orderCode = orderCode;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.itemCount = itemCount;
        this.totalAmount = totalAmount;
        this.status = status;
        this.paymentMethod = paymentMethod;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public Integer getItemCount() {
        return itemCount;
    }

    public void setItemCount(Integer itemCount) {
        this.itemCount = itemCount;
    }

    public Double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
