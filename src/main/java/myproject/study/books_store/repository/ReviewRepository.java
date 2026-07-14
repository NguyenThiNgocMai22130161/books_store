package myproject.study.books_store.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import myproject.study.books_store.model.Review;
import myproject.study.books_store.model.ReviewStatus;

import java.util.List;
import java.util.Map;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByBookId(Long bookId);
    List<Review> findByBookIdAndStatus(Long bookId, ReviewStatus status);
    List<Review> findByUserUserId(Long userId);
    List<Review> findByStatus(ReviewStatus status);

    // Dùng cho single book (BookDetail)
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.book.id = :bookId AND r.status = 'APPROVED'")
    Double findAvgRatingByBookId(@Param("bookId") Long bookId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.book.id = :bookId AND r.status = 'APPROVED'")
    Long countApprovedByBookId(@Param("bookId") Long bookId);

    // Dùng cho danh sách sách — 1 query duy nhất trả về tất cả bookId
    @Query("SELECT r.book.id AS bookId, AVG(r.rating) AS avgRating, COUNT(r) AS totalReviews " +
           "FROM Review r WHERE r.status = 'APPROVED' GROUP BY r.book.id")
    List<Map<String, Object>> findRatingSummaryForAllBooks();
}
