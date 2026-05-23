package myproject.study.books_store.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import myproject.study.books_store.model.Review;
import myproject.study.books_store.model.ReviewStatus;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByBookId(Long bookId);
    List<Review> findByBookIdAndStatus(Long bookId, ReviewStatus status);
    List<Review> findByUserUserId(Long userId);
    List<Review> findByStatus(ReviewStatus status);
}
