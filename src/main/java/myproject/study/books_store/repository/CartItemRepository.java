package myproject.study.books_store.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import myproject.study.books_store.model.Book;
import myproject.study.books_store.model.Cart;
import myproject.study.books_store.model.CartItem;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByCart(Cart cart);
    Optional<CartItem> findByCartAndBook(Cart cart, Book book);
    void deleteByCart(Cart cart);
}
