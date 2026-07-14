package myproject.study.books_store.dto;

/**
 * DTO for order item details
 */
public class AdminOrderItemResponse {
    
    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private String bookImageUrl;
    private Integer quantity;
    private Double price;
    private Double totalPrice;

    public AdminOrderItemResponse() {}

    public AdminOrderItemResponse(Long bookId, String bookTitle, String bookAuthor, 
                                 String bookImageUrl, Integer quantity, 
                                 Double price, Double totalPrice) {
        this.bookId = bookId;
        this.bookTitle = bookTitle;
        this.bookAuthor = bookAuthor;
        this.bookImageUrl = bookImageUrl;
        this.quantity = quantity;
        this.price = price;
        this.totalPrice = totalPrice;
    }

    // Getters and Setters
    public Long getBookId() {
        return bookId;
    }

    public void setBookId(Long bookId) {
        this.bookId = bookId;
    }

    public String getBookTitle() {
        return bookTitle;
    }

    public void setBookTitle(String bookTitle) {
        this.bookTitle = bookTitle;
    }

    public String getBookAuthor() {
        return bookAuthor;
    }

    public void setBookAuthor(String bookAuthor) {
        this.bookAuthor = bookAuthor;
    }

    public String getBookImageUrl() {
        return bookImageUrl;
    }

    public void setBookImageUrl(String bookImageUrl) {
        this.bookImageUrl = bookImageUrl;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Double getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(Double totalPrice) {
        this.totalPrice = totalPrice;
    }
}
