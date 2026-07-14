package myproject.study.books_store.dto;

/**
 * DTO for order statistics on admin dashboard
 */
public class OrderStatisticsResponse {
    
    private Long totalOrders;
    private Long pendingOrders;
    private Long confirmedOrders;
    private Long processingOrders;
    private Long shippingOrders;
    private Long deliveredOrders;
    private Long cancelledOrders;
    private Long paidOrders;
    private Double totalRevenue;

    public OrderStatisticsResponse() {}

    public OrderStatisticsResponse(Long totalOrders, Long pendingOrders, 
                                  Long confirmedOrders, Long processingOrders,
                                  Long shippingOrders, Long deliveredOrders, 
                                  Long cancelledOrders, Long paidOrders,
                                  Double totalRevenue) {
        this.totalOrders = totalOrders;
        this.pendingOrders = pendingOrders;
        this.confirmedOrders = confirmedOrders;
        this.processingOrders = processingOrders;
        this.shippingOrders = shippingOrders;
        this.deliveredOrders = deliveredOrders;
        this.cancelledOrders = cancelledOrders;
        this.paidOrders = paidOrders;
        this.totalRevenue = totalRevenue;
    }

    // Getters and Setters
    public Long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(Long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public Long getPendingOrders() {
        return pendingOrders;
    }

    public void setPendingOrders(Long pendingOrders) {
        this.pendingOrders = pendingOrders;
    }

    public Long getConfirmedOrders() {
        return confirmedOrders;
    }

    public void setConfirmedOrders(Long confirmedOrders) {
        this.confirmedOrders = confirmedOrders;
    }

    public Long getProcessingOrders() {
        return processingOrders;
    }

    public void setProcessingOrders(Long processingOrders) {
        this.processingOrders = processingOrders;
    }

    public Long getShippingOrders() {
        return shippingOrders;
    }

    public void setShippingOrders(Long shippingOrders) {
        this.shippingOrders = shippingOrders;
    }

    public Long getDeliveredOrders() {
        return deliveredOrders;
    }

    public void setDeliveredOrders(Long deliveredOrders) {
        this.deliveredOrders = deliveredOrders;
    }

    public Long getCancelledOrders() {
        return cancelledOrders;
    }

    public void setCancelledOrders(Long cancelledOrders) {
        this.cancelledOrders = cancelledOrders;
    }

    public Long getPaidOrders() {
        return paidOrders;
    }

    public void setPaidOrders(Long paidOrders) {
        this.paidOrders = paidOrders;
    }

    public Double getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(Double totalRevenue) {
        this.totalRevenue = totalRevenue;
    }
}
