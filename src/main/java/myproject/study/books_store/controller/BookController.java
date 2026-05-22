// package myproject.study.books_store.controller;

// import jakarta.validation.Valid;
// import myproject.study.books_store.model.Book;
// import myproject.study.books_store.service.BookService;
// import myproject.study.books_store.service.CategoryService;

// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.security.access.prepost.PreAuthorize;
// import org.springframework.validation.BindingResult;
// import org.springframework.web.bind.annotation.*;

// import java.util.HashMap;
// import java.util.List;
// import java.util.Map;

// @RestController
// @RequestMapping("/api/books")
// public class BookController {

//     private final BookService bookService;
//     private final CategoryService categoryService;

//     public BookController(BookService bookService, CategoryService categoryService) {
//         this.bookService = bookService;
//         this.categoryService = categoryService;
//     }

//     @GetMapping
//     public ResponseEntity<?> listBooks(@RequestParam(required = false) String title,
//                                       @RequestParam(required = false) String author,
//                                       @RequestParam(required = false) String category,
//                                       @RequestParam(required = false) Double minPrice,
//                                       @RequestParam(required = false) Double maxPrice) {
//         try {
//             List<Book> books;
            
//             boolean hasSearchCriteria = (title != null && !title.isEmpty()) || 
//                                        (author != null && !author.isEmpty()) || 
//                                        (category != null && !category.isEmpty()) || 
//                                        (minPrice != null && minPrice > 0) || 
//                                        (maxPrice != null && maxPrice > 0);
            
//             if (hasSearchCriteria) {
//                 Double effectiveMinPrice = (minPrice != null && minPrice > 0) ? minPrice : null;
//                 Double effectiveMaxPrice = (maxPrice != null && maxPrice > 0) ? maxPrice : null;
//                 books = bookService.searchBooks(title, author, category, effectiveMinPrice, effectiveMaxPrice);
//             } else {
//                 books = bookService.getAllBooks();
//             }
            
//             Map<String, Object> response = new HashMap<>();
//             response.put("books", books);
//             response.put("categories", categoryService.getAllCategories());
//             response.put("total", books.size());
            
//             return ResponseEntity.ok(response);
//         } catch (Exception e) {
//             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                     .body(Map.of("error", "Lỗi khi tải danh sách sách: " + e.getMessage()));
//         }
//     }

//     @PostMapping
//     @PreAuthorize("hasRole('ADMIN')")
//     public ResponseEntity<?> createBook(@Valid @RequestBody Book book, BindingResult result) {
//         if (result.hasErrors()) {
//             return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                     .body(Map.of("error", "Dữ liệu không hợp lệ!", "details", result.getAllErrors()));
//         }

//         try {
//             if (book.getImageUrl() == null || book.getImageUrl().trim().isEmpty()) {
//                 book.setImageUrl(null);
//                 book.setImageFilename(null);
//             } else {
//                 book.setImageFilename(null);
//             }

//             Book savedBook = bookService.saveBook(book);
//             return ResponseEntity.status(HttpStatus.CREATED)
//                     .body(Map.of("message", "Thêm sách thành công!", "book", savedBook));
//         } catch (Exception e) {
//             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                     .body(Map.of("error", "Lỗi khi thêm sách: " + e.getMessage()));
//         }
//     }

//     @GetMapping("/{id}")
//     public ResponseEntity<?> getBook(@PathVariable String id) {
//         return bookService.getBookById(id)
//                 .map(book -> ResponseEntity.ok((Object) book))
//                 .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
//                         .body(Map.of("error", "Không tìm thấy sách!")));
//     }

//     @PutMapping("/{id}")
//     @PreAuthorize("hasRole('ADMIN')")
//     public ResponseEntity<?> updateBook(@PathVariable String id, 
//                                        @Valid @RequestBody Book book, 
//                                        BindingResult result) {
//         if (result.hasErrors()) {
//             return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                     .body(Map.of("error", "Dữ liệu không hợp lệ!", "details", result.getAllErrors()));
//         }

//         return bookService.getBookById(id)
//                 .map(existingBook -> {
//                     book.setId(existingBook.getId());
//                     if (book.getImageUrl() == null || book.getImageUrl().trim().isEmpty()) {
//                         book.setImageUrl(null);
//                         book.setImageFilename(null);
//                     } else {
//                         book.setImageFilename(null);
//                     }
//                     Book updatedBook = bookService.saveBook(book);
//                     return ResponseEntity.ok((Object) Map.of("message", "Cập nhật sách thành công!", "book", updatedBook));
//                 })
//                 .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
//                         .body(Map.of("error", "Không tìm thấy sách!")));
//     }

//     @DeleteMapping("/{id}")
//     @PreAuthorize("hasRole('ADMIN')")
//     public ResponseEntity<?> deleteBook(@PathVariable String id) {
//         return bookService.getBookById(id)
//                 .map(book -> {
//                     bookService.deleteBook(id);
//                     return ResponseEntity.ok((Object) Map.of("message", "Xóa sách thành công!"));
//                 })
//                 .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
//                         .body(Map.of("error", "Không tìm thấy sách!")));
//     }
// }
