package myproject.study.books_store.controller;

import jakarta.validation.Valid;
import myproject.study.books_store.model.Category;
import myproject.study.books_store.service.CategoryService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public String listCategories(Model model) {
        model.addAttribute("categories", categoryService.getAllCategories());
        return "category/list";
    }

    @GetMapping("/add")
    @PreAuthorize("hasRole('ADMIN')")
    public String showAddForm(Model model) {
        model.addAttribute("category", new Category());
        model.addAttribute("pageTitle", "Thêm Danh Mục Mới");
        return "category/form";
    }

    @PostMapping("/save")
    @PreAuthorize("hasRole('ADMIN')")
    public String saveCategory(@Valid @ModelAttribute Category category,
                              BindingResult result,
                              Model model,
                              RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            model.addAttribute("pageTitle", category.getId() == null ? "Thêm Danh Mục Mới" : "Sửa Danh Mục");
            return "category/form";
        }

        categoryService.saveCategory(category);
        redirectAttributes.addFlashAttribute("successMessage", "Lưu danh mục thành công!");
        return "redirect:/categories";
    }

    @GetMapping("/edit/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public String showEditForm(@PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        return categoryService.getCategoryById(id)
                .map(category -> {
                    model.addAttribute("category", category);
                    model.addAttribute("pageTitle", "Sửa Danh Mục");
                    return "category/form";
                })
                .orElseGet(() -> {
                    redirectAttributes.addFlashAttribute("errorMessage", "Không tìm thấy danh mục!");
                    return "redirect:/categories";
                });
    }

    @GetMapping("/delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public String deleteCategory(@PathVariable String id, RedirectAttributes redirectAttributes) {
        categoryService.getCategoryById(id).ifPresent(category -> {
            // Không cho phép xóa danh mục mặc định
            if (category.isDefault()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Không thể xóa danh mục mặc định!");
            } else {
                categoryService.deleteCategory(id);
                redirectAttributes.addFlashAttribute("successMessage", "Xóa danh mục thành công! Các sách trong danh mục này đã được chuyển sang danh mục chưa phân loại.");
            }
        });
        return "redirect:/categories";
    }
}

