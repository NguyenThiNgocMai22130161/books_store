package myproject.study.books_store.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import myproject.study.books_store.model.Book;
import myproject.study.books_store.service.BookService;

import java.util.List;

@RestController
@RequestMapping("/api/books")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class BookApiController {

    private final BookService bookService;

    public BookApiController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping
    public ResponseEntity<List<Book>> getAllBooks(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice
    ) {
        // Log để debug
        System.out.println("=== BookApiController.getAllBooks ===");
        System.out.println("title: " + title);
        System.out.println("author: " + author);
        System.out.println("category: " + category);
        System.out.println("minPrice: " + minPrice);
        System.out.println("maxPrice: " + maxPrice);
        
        // Nếu có bất kỳ filter nào, dùng searchBooks
        if (title != null || author != null || category != null || minPrice != null || maxPrice != null) {
            System.out.println("Using searchBooks with filters");
            List<Book> results = bookService.searchBooks(title, author, category, minPrice, maxPrice);
            System.out.println("Found " + results.size() + " books");
            return ResponseEntity.ok(results);
        }
        // Nếu không có filter, trả về tất cả
        System.out.println("No filters, returning all books");
        List<Book> allBooks = bookService.getAllBooks();
        System.out.println("Total books: " + allBooks.size());
        return ResponseEntity.ok(allBooks);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Book> getBookById(@PathVariable String id) {
        return bookService.getBookById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Book> createBook(@RequestBody Book book) {
        return ResponseEntity.ok(bookService.saveBook(book));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Book> updateBook(@PathVariable String id, @RequestBody Book bookDetails) {
        Book updatedBook = bookService.updateBook(id, bookDetails);
        return updatedBook != null ? ResponseEntity.ok(updatedBook) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBook(@PathVariable String id) {
        bookService.deleteBook(id);
        return ResponseEntity.ok().build();
    }

    // File upload removed — use image URL links instead.
}
