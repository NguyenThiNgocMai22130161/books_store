package myproject.study.books_store.controller;

import jakarta.validation.Valid;
import myproject.study.books_store.model.Category;
import myproject.study.books_store.service.CategoryService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/categories")
public class CategoryApiController {

    private final CategoryService categoryService;

    public CategoryApiController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    // GET all categories
    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    // GET category by id
    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable String id) {
        Optional<Category> category = categoryService.getCategoryById(id);
        return category.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // GET category by name
    @GetMapping("/name/{name}")
    public ResponseEntity<Category> getCategoryByName(@PathVariable String name) {
        Optional<Category> category = categoryService.getCategoryByName(name);
        return category.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // GET default category
    @GetMapping("/default/category")
    public ResponseEntity<Category> getDefaultCategory() {
        Category category = categoryService.getDefaultCategory();
        if (category != null) {
            return ResponseEntity.ok(category);
        }
        return ResponseEntity.notFound().build();
    }

    // POST create new category
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Category> createCategory(@Valid @RequestBody Category category) {
        Category savedCategory = categoryService.saveCategory(category);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedCategory);
    }

    // PUT update category
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Category> updateCategory(@PathVariable String id, @Valid @RequestBody Category categoryDetails) {
        Category updatedCategory = categoryService.updateCategory(id, categoryDetails);
        if (updatedCategory != null) {
            return ResponseEntity.ok(updatedCategory);
        }
        return ResponseEntity.notFound().build();
    }

    // DELETE category
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCategory(@PathVariable String id) {
        Optional<Category> category = categoryService.getCategoryById(id);
        if (category.isPresent()) {
            if (category.get().isDefault()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }
            categoryService.deleteCategory(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
