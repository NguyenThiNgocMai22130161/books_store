package myproject.study.books_store.service;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import myproject.study.books_store.event.BookChangedEvent;
import myproject.study.books_store.event.BookChangeType;
import myproject.study.books_store.model.Book;
import myproject.study.books_store.repository.BookRepository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BookService {
    private final BookRepository bookRepository;
    private final ApplicationEventPublisher eventPublisher;

    public BookService(BookRepository bookRepository, ApplicationEventPublisher eventPublisher) {
        this.bookRepository = bookRepository;
        this.eventPublisher = eventPublisher;
    }

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    public Optional<Book> getBookById(String id) {
        return bookRepository.findById(Long.parseLong(id));
    }

    @SuppressWarnings("null")
    @Transactional
    public Book saveBook(Book book) {
        // Kiểm tra xem đã có sách với cùng tên và tác giả chưa
        List<Book> existingBooks = bookRepository.findByTitleAndAuthor(book.getTitle(), book.getAuthor());
        
        if (!existingBooks.isEmpty()) {
            throw new RuntimeException("Sách '" + book.getTitle() + "' của tác giả '" + book.getAuthor() + "' đã tồn tại trong hệ thống!");
        }
        
        Book savedBook = bookRepository.save(book);
        
        // Publish CREATED event
        eventPublisher.publishEvent(new BookChangedEvent(savedBook.getId(), BookChangeType.CREATED));
        
        return savedBook;
    }

    @Transactional
    public Book updateBook(String id, Book bookDetails) {
        return bookRepository.findById(Long.parseLong(id)).map(book -> {
            book.setTitle(bookDetails.getTitle());
            book.setAuthor(bookDetails.getAuthor());
            book.setPrice(bookDetails.getPrice());
            book.setYear(bookDetails.getYear());
            book.setCategory(bookDetails.getCategory());
            book.setDescription(bookDetails.getDescription());
            book.setQuantity(bookDetails.getQuantity());
            
            if (bookDetails.getImageUrl() != null) {
                book.setImageUrl(bookDetails.getImageUrl());
                book.setImageFilename(bookDetails.getImageFilename());
            }
            
            Book updatedBook = bookRepository.save(book);
            
            // Publish UPDATED event
            eventPublisher.publishEvent(new BookChangedEvent(updatedBook.getId(), BookChangeType.UPDATED));
            
            return updatedBook;
        }).orElse(null);
    }

    @Transactional
    public void deleteBook(String id) {
        Long bookId = Long.parseLong(id);
        bookRepository.deleteById(bookId);
        
        // Publish DELETED event
        eventPublisher.publishEvent(new BookChangedEvent(bookId, BookChangeType.DELETED));
    }
    
    // ===== SEARCH METHODS =====
    
    /**
     * Tìm kiếm sách theo tên (tìm kiếm phần từ)
     */
    public List<Book> searchByTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            return getAllBooks();
        }
        return bookRepository.findByTitleContainingIgnoreCase(title);
    }
    
    /**
     * Tìm kiếm sách theo tác giả (tìm kiếm phần từ)
     */
    public List<Book> searchByAuthor(String author) {
        if (author == null || author.trim().isEmpty()) {
            return getAllBooks();
        }
        return bookRepository.findByAuthorContainingIgnoreCase(author);
    }
    
    /**
     * Tìm kiếm sách theo giá (trong khoảng từ minPrice đến maxPrice)
     * SỬA: Kiểm tra giá trị hợp lệ
     */
    public List<Book> searchByPrice(Double minPrice, Double maxPrice) {
        // CHỈ FILTER KHI CÓ GIÁ TRỊ HỢP LỆ
        if (isValidPrice(minPrice) && isValidPrice(maxPrice)) {
            return bookRepository.findByPriceBetween(minPrice, maxPrice);
        } else if (isValidPrice(minPrice)) {
            // Chỉ có minPrice
            return bookRepository.findByPriceGreaterThanEqual(minPrice);
        } else if (isValidPrice(maxPrice)) {
            // Chỉ có maxPrice
            return bookRepository.findByPriceLessThanEqual(maxPrice);
        }
        return getAllBooks();
    }
    
    /**
     * Tìm kiếm sách theo danh mục
     */
    public List<Book> searchByCategory(String category) {
        if (category == null || category.trim().isEmpty()) {
            return getAllBooks();
        }
        return bookRepository.findByCategory(category);
    }
    
    /**
     * Tìm kiếm sách theo danh mục và giá
     */
    public List<Book> searchByCategoryAndPrice(String category, Double minPrice, Double maxPrice) {
        if (category == null || category.trim().isEmpty()) {
            return searchByPrice(minPrice, maxPrice);
        }
        if (!isValidPrice(minPrice) && !isValidPrice(maxPrice)) {
            return searchByCategory(category);
        }
        
        // Có danh mục và có ít nhất một giá trị hợp lệ
        if (isValidPrice(minPrice) && isValidPrice(maxPrice)) {
            return bookRepository.findByCategoryAndPriceBetween(category, minPrice, maxPrice);
        } else if (isValidPrice(minPrice)) {
            return bookRepository.findByCategoryAndPriceGreaterThanEqual(category, minPrice);
        } else {
            return bookRepository.findByCategoryAndPriceLessThanEqual(category, maxPrice);
        }
    }
    
    /**
     * Tìm kiếm kết hợp: theo tên + tác giả + danh mục + giá
     * SỬA: Kiểm tra giá trị hợp lệ trước khi filter
     */
    public List<Book> searchBooks(String title, String author, String category, Double minPrice, Double maxPrice) {
        System.out.println("=== BookService.searchBooks ===");
        System.out.println("Input - title: " + title + ", author: " + author + ", category: " + category);
        System.out.println("Input - minPrice: " + minPrice + ", maxPrice: " + maxPrice);
        
        List<Book> results = getAllBooks();
        System.out.println("Starting with " + results.size() + " books");
        
        // Lọc theo tên sách
        if (title != null && !title.trim().isEmpty()) {
            results = results.stream()
                    .filter(book -> book.getTitle().toLowerCase().contains(title.toLowerCase()))
                    .collect(Collectors.toList());
            System.out.println("After title filter: " + results.size() + " books");
        }
        
        // Lọc theo tác giả
        if (author != null && !author.trim().isEmpty()) {
            results = results.stream()
                    .filter(book -> book.getAuthor().toLowerCase().contains(author.toLowerCase()))
                    .collect(Collectors.toList());
            System.out.println("After author filter: " + results.size() + " books");
        }
        
        // Lọc theo danh mục
        if (category != null && !category.trim().isEmpty()) {
            results = results.stream()
                    .filter(book -> book.getCategory() != null && book.getCategory().equals(category))
                    .collect(Collectors.toList());
            System.out.println("After category filter: " + results.size() + " books");
        }
        
        // Lọc theo giá - SỬA: CHỈ KHI CÓ GIÁ TRỊ HỢP LỆ
        boolean hasValidMinPrice = isValidPrice(minPrice);
        boolean hasValidMaxPrice = isValidPrice(maxPrice);
        
        System.out.println("Price validation - hasValidMinPrice: " + hasValidMinPrice + ", hasValidMaxPrice: " + hasValidMaxPrice);
        
        if (hasValidMinPrice && hasValidMaxPrice) {
            // Có cả min và max
            results = results.stream()
                    .filter(book -> book.getPrice() >= minPrice && book.getPrice() <= maxPrice)
                    .collect(Collectors.toList());
            System.out.println("After price range filter: " + results.size() + " books");
        } else if (hasValidMinPrice) {
            // Chỉ có min
            results = results.stream()
                    .filter(book -> book.getPrice() >= minPrice)
                    .collect(Collectors.toList());
            System.out.println("After min price filter: " + results.size() + " books");
        } else if (hasValidMaxPrice) {
            // Chỉ có max
            results = results.stream()
                    .filter(book -> book.getPrice() <= maxPrice)
                    .collect(Collectors.toList());
            System.out.println("After max price filter: " + results.size() + " books");
        }
        // Nếu không có giá trị hợp lệ, bỏ qua filter giá
        
        System.out.println("Final result: " + results.size() + " books");
        return results;
    }
    
    /**
     * Helper method: Kiểm tra giá có hợp lệ không
     * - Không null
     * - > 0
     * - Không phải Double.MAX_VALUE
     */
    private boolean isValidPrice(Double price) {
        if (price == null) return false;
        if (price <= 0) return false;
        // Không chấp nhận Double.MAX_VALUE
        if (price >= Double.MAX_VALUE - 1) return false;
        return true;
    }
    
    /**
     * Phương thức search mới với xử lý tốt hơn (tùy chọn)
     */
    public List<Book> advancedSearch(String title, String author, String category, 
                                     Double minPrice, Double maxPrice) {
        List<Book> results = getAllBooks();
        
        // Filter theo từng điều kiện nếu có
        if (title != null && !title.trim().isEmpty()) {
            results = filterByTitle(results, title);
        }
        
        if (author != null && !author.trim().isEmpty()) {
            results = filterByAuthor(results, author);
        }
        
        if (category != null && !category.trim().isEmpty()) {
            results = filterByCategory(results, category);
        }
        
        // Xử lý giá đặc biệt
        results = filterByPriceRange(results, minPrice, maxPrice);
        
        return results;
    }
    
    private List<Book> filterByTitle(List<Book> books, String title) {
        return books.stream()
                .filter(book -> book.getTitle().toLowerCase().contains(title.toLowerCase()))
                .collect(Collectors.toList());
    }
    
    private List<Book> filterByAuthor(List<Book> books, String author) {
        return books.stream()
                .filter(book -> book.getAuthor().toLowerCase().contains(author.toLowerCase()))
                .collect(Collectors.toList());
    }
    
    private List<Book> filterByCategory(List<Book> books, String category) {
        return books.stream()
                .filter(book -> book.getCategory() != null && book.getCategory().equals(category))
                .collect(Collectors.toList());
    }
    
    private List<Book> filterByPriceRange(List<Book> books, Double minPrice, Double maxPrice) {
        boolean hasMin = isValidPrice(minPrice);
        boolean hasMax = isValidPrice(maxPrice);
        
        if (!hasMin && !hasMax) {
            return books;
        }
        
        return books.stream()
                .filter(book -> {
                    double price = book.getPrice();
                    boolean minCondition = !hasMin || price >= minPrice;
                    boolean maxCondition = !hasMax || price <= maxPrice;
                    return minCondition && maxCondition;
                })
                .collect(Collectors.toList());
    }
}
