package myproject.study.books_store.dto;

public class BookWithRatingDTO {

    private Long id;
    private String title;
    private String author;
    private Double price;
    private Integer year;
    private String category;
    private String imageUrl;
    private String description;
    private Integer quantity;
    private Double avgRating;
    private Long totalReviews;

    public BookWithRatingDTO() {}

    public BookWithRatingDTO(Long id, String title, String author, Double price,
                              Integer year, String category, String imageUrl,
                              String description, Integer quantity,
                              Double avgRating, Long totalReviews) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.price = price;
        this.year = year;
        this.category = category;
        this.imageUrl = imageUrl;
        this.description = description;
        this.quantity = quantity;
        this.avgRating = avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : null;
        this.totalReviews = totalReviews != null ? totalReviews : 0L;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getAuthor() { return author; }
    public Double getPrice() { return price; }
    public Integer getYear() { return year; }
    public String getCategory() { return category; }
    public String getImageUrl() { return imageUrl; }
    public String getDescription() { return description; }
    public Integer getQuantity() { return quantity; }
    public Double getAvgRating() { return avgRating; }
    public Long getTotalReviews() { return totalReviews; }
}
