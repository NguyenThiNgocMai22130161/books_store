package myproject.study.books_store.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import myproject.study.books_store.model.Book;
import myproject.study.books_store.model.Cart;
import myproject.study.books_store.model.CartItem;
import myproject.study.books_store.model.User;
import myproject.study.books_store.repository.BookRepository;
import myproject.study.books_store.repository.CartItemRepository;
import myproject.study.books_store.repository.CartRepository;

import java.util.List;
import java.util.Optional;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final BookRepository bookRepository;

    public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository, BookRepository bookRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.bookRepository = bookRepository;
    }

    public Cart getOrCreateCart(User user) {
        return cartRepository.findByUser(user)
                .orElseGet(() -> {
                    Cart newCart = new Cart(user);
                    return cartRepository.save(newCart);
                });
    }

    public List<CartItem> getCartItems(User user) {
        Cart cart = getOrCreateCart(user);
        return cartItemRepository.findByCart(cart);
    }

    @Transactional
    public CartItem addToCart(User user, String bookId, int quantity) {
        Cart cart = getOrCreateCart(user);
        Long bookIdValue = Long.parseLong(bookId);
        Book book = bookRepository.findById(bookIdValue)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        if (book.getQuantity() < quantity) {
            throw new RuntimeException("Not enough books in stock");
        }

        Optional<CartItem> existingItem = cartItemRepository.findByCartAndBook(cart, book);

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + quantity);
            return cartItemRepository.save(item);
        } else {
            CartItem newItem = new CartItem(cart, book, quantity);
            return cartItemRepository.save(newItem);
        }
    }

    @Transactional
    public CartItem updateCartItem(String itemId, int quantity) {
        long cartItemId = Long.parseLong(itemId);
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        if (item.getBook().getQuantity() < quantity) {
            throw new RuntimeException("Not enough books in stock");
        }

        item.setQuantity(quantity);
        return cartItemRepository.save(item);
    }

    @Transactional
    public void removeFromCart(String itemId) {
        long cartItemId = Long.parseLong(itemId);
        cartItemRepository.deleteById(cartItemId);
    }

    @Transactional
    public void clearCart(User user) {
        Cart cart = getOrCreateCart(user);
        cartItemRepository.deleteByCart(cart);
    }

    public Double getCartTotal(User user) {
        return getCartItems(user).stream()
                .mapToDouble(item -> item.getTotalPrice() != null ? item.getTotalPrice() : 0.0)
                .sum();
    }

    public int getCartItemCount(User user) {
        return getCartItems(user).stream()
                .mapToInt(CartItem::getQuantity)
                .sum();
    }
}
