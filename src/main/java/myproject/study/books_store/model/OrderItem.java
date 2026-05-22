package myproject.study.books_store.model;

import jakarta.persistence.Embeddable;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;

@Embeddable
public class OrderItem {

    @ManyToOne(fetch = FetchType.EAGER)
    private Book book;

    private Integer quantity;

    private Double price; // Giá tại thời điểm mua

    public OrderItem() {}

    public OrderItem(Book book, Integer quantity) {
        this.book = book;
        this.quantity = quantity;
        this.price = book.getPrice();
    }

    // Getters and Setters
    public Book getBook() {
        return book;
    }

    public void setBook(Book book) {
        this.book = book;
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

    /**
     * Tính tổng giá cho item này
     */
    public Double getTotalPrice() {
        return price * quantity;
    }

    /**
     * Lấy tiêu đề sách
     */
    public String getBookTitle() {
        return book != null ? book.getTitle() : "Unknown";
    }

    /**
     * Lấy tác giả
     */
    public String getBookAuthor() {
        return book != null ? book.getAuthor() : "Unknown";
    }
}
