package myproject.study.books_store.service;

import org.springframework.stereotype.Service;

import myproject.study.books_store.model.Book;
import myproject.study.books_store.model.Category;
import myproject.study.books_store.repository.BookRepository;
import myproject.study.books_store.repository.CategoryRepository;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final BookRepository bookRepository;

    public CategoryService(CategoryRepository categoryRepository, BookRepository bookRepository) {
        this.categoryRepository = categoryRepository;
        this.bookRepository = bookRepository;
    }

    // CRUD Operations
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Optional<Category> getCategoryById(String id) {
        return categoryRepository.findById(Long.parseLong(id));
    }

    @SuppressWarnings("null")
    public Category saveCategory(Category category) {
        return categoryRepository.save(category);
    }

    public Category updateCategory(String id, Category categoryDetails) {
        return categoryRepository.findById(Long.parseLong(id)).map(category -> {
            category.setName(categoryDetails.getName());
            category.setDescription(categoryDetails.getDescription());
            return categoryRepository.save(category);
        }).orElse(null);
    }

    public void deleteCategory(String id) {
        Optional<Category> category = categoryRepository.findById(Long.parseLong(id));
        if (category.isPresent()) {
            // Get default category for reassigning books
            Optional<Category> defaultCategory = categoryRepository.findByIsDefaultTrue();
            
            if (defaultCategory.isPresent()) {
                // Find all books in this category
                List<Book> booksInCategory = bookRepository.findByCategory(category.get().getName());
                
                // Reassign books to default category
                for (Book book : booksInCategory) {
                    book.setCategory(defaultCategory.get().getName());
                    bookRepository.save(book);
                }
            }
            
            // Delete the category
            categoryRepository.deleteById(Long.parseLong(id));
        }
    }

    // Get default uncategorized category
    public Category getDefaultCategory() {
        return categoryRepository.findByIsDefaultTrue()
                .orElse(null);
    }

    // Find category by name
    public Optional<Category> getCategoryByName(String name) {
        return categoryRepository.findByName(name);
    }

    // Get books by category
    public List<Book> getBooksByCategory(String categoryName) {
        return bookRepository.findByCategory(categoryName);
    }
}
