package myproject.study.books_store.service;

import org.springframework.stereotype.Service;

import myproject.study.books_store.model.Book;
import myproject.study.books_store.repository.BookRepository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BookService {
    private final BookRepository bookRepository;

    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    public Optional<Book> getBookById(String id) {
        return bookRepository.findById(Long.parseLong(id));
    }

    @SuppressWarnings("null")
    public Book saveBook(Book book) {
        return bookRepository.save(book);
    }

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
            
            return bookRepository.save(book);
        }).orElse(null);
    }

    public void deleteBook(String id) {
        bookRepository.deleteById(Long.parseLong(id));
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
        List<Book> results = getAllBooks();
        
        // Lọc theo tên sách
        if (title != null && !title.trim().isEmpty()) {
            results = results.stream()
                    .filter(book -> book.getTitle().toLowerCase().contains(title.toLowerCase()))
                    .collect(Collectors.toList());
        }
        
        // Lọc theo tác giả
        if (author != null && !author.trim().isEmpty()) {
            results = results.stream()
                    .filter(book -> book.getAuthor().toLowerCase().contains(author.toLowerCase()))
                    .collect(Collectors.toList());
        }
        
        // Lọc theo danh mục
        if (category != null && !category.trim().isEmpty()) {
            results = results.stream()
                    .filter(book -> book.getCategory() != null && book.getCategory().equals(category))
                    .collect(Collectors.toList());
        }
        
        // Lọc theo giá - SỬA: CHỈ KHI CÓ GIÁ TRỊ HỢP LỆ
        boolean hasValidMinPrice = isValidPrice(minPrice);
        boolean hasValidMaxPrice = isValidPrice(maxPrice);
        
        if (hasValidMinPrice && hasValidMaxPrice) {
            // Có cả min và max
            results = results.stream()
                    .filter(book -> book.getPrice() >= minPrice && book.getPrice() <= maxPrice)
                    .collect(Collectors.toList());
        } else if (hasValidMinPrice) {
            // Chỉ có min
            results = results.stream()
                    .filter(book -> book.getPrice() >= minPrice)
                    .collect(Collectors.toList());
        } else if (hasValidMaxPrice) {
            // Chỉ có max
            results = results.stream()
                    .filter(book -> book.getPrice() <= maxPrice)
                    .collect(Collectors.toList());
        }
        // Nếu không có giá trị hợp lệ, bỏ qua filter giá
        
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
