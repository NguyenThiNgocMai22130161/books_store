package myproject.study.books_store.repository;

import myproject.study.books_store.model.Wishlist;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository
        extends JpaRepository<Wishlist, Long> {

    List<Wishlist> findByUserUserId(Long userId);

    Optional<Wishlist> findByUserUserIdAndBookId(
            Long userId,
            Long bookId
    );

    boolean existsByUserUserIdAndBookId(
            Long userId,
            Long bookId
    );

    void deleteByUserUserIdAndBookId(
            Long userId,
            Long bookId
    );
}