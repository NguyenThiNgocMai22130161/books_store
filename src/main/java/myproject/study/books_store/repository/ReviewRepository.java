package myproject.study.books_store.repository;

import myproject.study.books_store.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByBookIdOrderByCreatedAtDesc(Long bookId);
    Optional<Review> findByUserUserIdAndBookId(Long userId, Long bookId);
    boolean existsByUserUserIdAndBookId(Long userId, Long bookId);
}