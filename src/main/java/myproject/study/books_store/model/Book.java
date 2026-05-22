package myproject.study.books_store.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "books")
public class Book {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Ten sach khong duoc de trong")
    private String title;
    
    @NotBlank(message = "Tac gia khong duoc de trong")
    private String author;
    
    @NotNull(message = "Gia khong duoc de trong")
    @Min(value = 0, message = "Gia phai lon hon hoac bang 0")
    private Double price;
    
    private Integer year;
    private String category;
    
    // Thêm field cho hình ảnh
    @Column(columnDefinition = "TEXT")
    private String imageUrl;
    private String imageFilename;
    @Column(columnDefinition = "TEXT")
    private String description;
    private Integer quantity = 0;

    public Book() {}

    public Book(String title, String author, Double price, Integer year, String category) {
        this.title = title;
        this.author = author;
        this.price = price;
        this.year = year;
        this.category = category;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getImageFilename() { return imageFilename; }
    public void setImageFilename(String imageFilename) { this.imageFilename = imageFilename; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
