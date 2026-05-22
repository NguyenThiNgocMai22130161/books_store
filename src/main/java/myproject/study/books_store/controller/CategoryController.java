// package myproject.study.books_store.controller;

// import jakarta.validation.Valid;
// import myproject.study.books_store.model.Category;
// import myproject.study.books_store.service.CategoryService;

// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.security.access.prepost.PreAuthorize;
// import org.springframework.validation.BindingResult;
// import org.springframework.web.bind.annotation.*;

// import java.util.List;
// import java.util.Map;

// @RestController
// @RequestMapping("/api/categories")
// public class CategoryController {

//     private final CategoryService categoryService;

//     public CategoryController(CategoryService categoryService) {
//         this.categoryService = categoryService;
//     }

//     @GetMapping
//     public ResponseEntity<?> listCategories() {
//         try {
//             List<Category> categories = categoryService.getAllCategories();
//             return ResponseEntity.ok(categories);
//         } catch (Exception e) {
//             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                     .body(Map.of("error", "Lỗi khi tải danh sách danh mục: " + e.getMessage()));
//         }
//     }

//     @PostMapping
//     @PreAuthorize("hasRole('ADMIN')")
//     public ResponseEntity<?> createCategory(@Valid @RequestBody Category category, BindingResult result) {
//         if (result.hasErrors()) {
//             return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                     .body(Map.of("error", "Dữ liệu không hợp lệ!", "details", result.getAllErrors()));
//         }

//         try {
//             Category savedCategory = categoryService.saveCategory(category);
//             return ResponseEntity.status(HttpStatus.CREATED)
//                     .body(Map.of("message", "Thêm danh mục thành công!", "category", savedCategory));
//         } catch (Exception e) {
//             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                     .body(Map.of("error", "Lỗi khi thêm danh mục: " + e.getMessage()));
//         }
//     }

//     @GetMapping("/{id}")
//     public ResponseEntity<?> getCategory(@PathVariable String id) {
//         return categoryService.getCategoryById(id)
//                 .map(category -> ResponseEntity.ok((Object) category))
//                 .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
//                         .body(Map.of("error", "Không tìm thấy danh mục!")));
//     }

//     @PutMapping("/{id}")
//     @PreAuthorize("hasRole('ADMIN')")
//     public ResponseEntity<?> updateCategory(@PathVariable String id, 
//                                            @Valid @RequestBody Category category, 
//                                            BindingResult result) {
//         if (result.hasErrors()) {
//             return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                     .body(Map.of("error", "Dữ liệu không hợp lệ!", "details", result.getAllErrors()));
//         }

//         return categoryService.getCategoryById(id)
//                 .map(existingCategory -> {
//                     category.setId(existingCategory.getId());
//                     Category updatedCategory = categoryService.saveCategory(category);
//                     return ResponseEntity.ok((Object) Map.of("message", "Cập nhật danh mục thành công!", "category", updatedCategory));
//                 })
//                 .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
//                         .body(Map.of("error", "Không tìm thấy danh mục!")));
//     }

//     @DeleteMapping("/{id}")
//     @PreAuthorize("hasRole('ADMIN')")
//     public ResponseEntity<?> deleteCategory(@PathVariable String id) {
//         return categoryService.getCategoryById(id)
//                 .map(category -> {
//                     if (category.isDefault()) {
//                         return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                                 .body((Object) Map.of("error", "Không thể xóa danh mục mặc định!"));
//                     }
//                     categoryService.deleteCategory(id);
//                     return ResponseEntity.ok((Object) Map.of("message", "Xóa danh mục thành công! Các sách trong danh mục này đã được chuyển sang danh mục chưa phân loại."));
//                 })
//                 .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
//                         .body(Map.of("error", "Không tìm thấy danh mục!")));
//     }
// }

