package myproject.study.books_store.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import myproject.study.books_store.model.Book;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByCategory(String category);
    
    List<Book> findByPriceGreaterThanEqual(Double minPrice);
    List<Book> findByPriceLessThanEqual(Double maxPrice);
    List<Book> findByCategoryAndPriceGreaterThanEqual(String category, Double minPrice);
    List<Book> findByCategoryAndPriceLessThanEqual(String category, Double maxPrice);
    // Tìm kiếm theo tên sách (không phân biệt chữ hoa/thường)
    List<Book> findByTitleIgnoreCase(String title);
    List<Book> findByTitleContainingIgnoreCase(String title);
    
    // Tìm kiếm theo tác giả (không phân biệt chữ hoa/thường)
    List<Book> findByAuthorIgnoreCase(String author);
    List<Book> findByAuthorContainingIgnoreCase(String author);
    
    // Tìm kiếm theo giá
    List<Book> findByPriceBetween(Double minPrice, Double maxPrice);
    
    // Tìm kiếm theo danh mục
    List<Book> findByCategoryAndPriceBetween(String category, Double minPrice, Double maxPrice);
    
    // Tìm kiếm theo tên sách và giá
    List<Book> findByTitleContainingIgnoreCaseAndPriceBetween(String title, Double minPrice, Double maxPrice);
    
    // Tìm kiếm theo tác giả và giá
    List<Book> findByAuthorContainingIgnoreCaseAndPriceBetween(String author, Double minPrice, Double maxPrice);
    
    // Tìm kiếm kết hợp: tên sách + tác giả + danh mục + giá
    @Query("SELECT b FROM Book b WHERE LOWER(b.title) LIKE LOWER(CONCAT('%', :title, '%')) " +
           "AND LOWER(b.author) LIKE LOWER(CONCAT('%', :author, '%')) " +
           "AND b.category = :category " +
           "AND b.price BETWEEN :minPrice AND :maxPrice")
    List<Book> searchByCriteria(@Param("title") String title,
                                @Param("author") String author,
                                @Param("category") String category,
                                @Param("minPrice") Double minPrice,
                                @Param("maxPrice") Double maxPrice);
}
