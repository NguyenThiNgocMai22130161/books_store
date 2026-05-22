package myproject.study.books_store.controller;

import jakarta.validation.Valid;
import myproject.study.books_store.model.Book;
import myproject.study.books_store.service.BookService;
import myproject.study.books_store.service.CategoryService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import java.util.List;

@Controller
@RequestMapping("/books")
public class BookController {

    private final BookService bookService;
    private final CategoryService categoryService;

    public BookController(BookService bookService, CategoryService categoryService) {
        this.bookService = bookService;
        this.categoryService = categoryService;
    }

    @GetMapping
    public String listBooks(Model model,
                           @RequestParam(required = false) String title,
                           @RequestParam(required = false) String author,
                           @RequestParam(required = false) String category,
                           @RequestParam(required = false) Double minPrice,
                           @RequestParam(required = false) Double maxPrice) {
        
        List<Book> books;
        
        // Kiểm tra xem có tiêu chí tìm kiếm nào không
        boolean hasSearchCriteria = (title != null && !title.isEmpty()) || 
                                   (author != null && !author.isEmpty()) || 
                                   (category != null && !category.isEmpty()) || 
                                   (minPrice != null && minPrice > 0) || 
                                   (maxPrice != null && maxPrice > 0);
        
        if (hasSearchCriteria) {
            // CHỈ ÁP DỤNG FILTER KHI CÓ GIÁ TRỊ HỢP LỆ (> 0)
            Double effectiveMinPrice = (minPrice != null && minPrice > 0) ? minPrice : null;
            Double effectiveMaxPrice = (maxPrice != null && maxPrice > 0) ? maxPrice : null;
            
            books = bookService.searchBooks(title, author, category, effectiveMinPrice, effectiveMaxPrice);
            
            // Truyền lại các tiêu chí tìm kiếm để hiển thị trong form
            // CHỈ TRUYỀN KHI CÓ GIÁ TRỊ HỢP LỆ
            model.addAttribute("searchTitle", title);
            model.addAttribute("searchAuthor", author);
            model.addAttribute("searchCategory", category);
            model.addAttribute("searchMinPrice", (minPrice != null && minPrice > 0) ? minPrice : null);
            model.addAttribute("searchMaxPrice", (maxPrice != null && maxPrice > 0) ? maxPrice : null);
        } else {
            books = bookService.getAllBooks();
        }
        
        model.addAttribute("books", books);
        model.addAttribute("categories", categoryService.getAllCategories());
        return "book/list";
    }

    @GetMapping("/add")
    @PreAuthorize("hasRole('ADMIN')")
    public String showAddForm(Model model) {
        model.addAttribute("book", new Book());
        model.addAttribute("pageTitle", "Thêm Sách Mới");
        model.addAttribute("categories", categoryService.getAllCategories());
        return "book/form";
    }

    @PostMapping("/save")
    @PreAuthorize("hasRole('ADMIN')")
    public String saveBook(@Valid @ModelAttribute Book book,
                          BindingResult result,
                          Model model,
                          RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            model.addAttribute("pageTitle", book.getId() == null ? "Thêm Sách Mới" : "Sửa Sách");
            model.addAttribute("categories", categoryService.getAllCategories());
            return "book/form";
        }

        // Nếu người dùng nhập link ảnh, giữ nguyên; nếu để trống, xóa trường ảnh
        if (book.getImageUrl() == null || book.getImageUrl().trim().isEmpty()) {
            book.setImageUrl(null);
            book.setImageFilename(null);
        } else {
            // Không lưu file lên server — chỉ lưu link. imageFilename giữ null.
            book.setImageFilename(null);
        }

        bookService.saveBook(book);
        redirectAttributes.addFlashAttribute("successMessage", "Lưu sách thành công!");
        return "redirect:/books";
    }

    @GetMapping("/edit/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public String showEditForm(@PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        return bookService.getBookById(id)
                .map(book -> {
                    model.addAttribute("book", book);
                    model.addAttribute("pageTitle", "Sửa Sách");
                    model.addAttribute("categories", categoryService.getAllCategories());
                    return "book/form";
                })
                .orElseGet(() -> {
                    redirectAttributes.addFlashAttribute("errorMessage", "Không tìm thấy sách!");
                    return "redirect:/books";
                });
    }

    @GetMapping("/delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public String deleteBook(@PathVariable String id, RedirectAttributes redirectAttributes) {
        bookService.getBookById(id).ifPresent(book -> {
            bookService.deleteBook(id);
        });
        redirectAttributes.addFlashAttribute("successMessage", "Xóa sách thành công!");
        return "redirect:/books";
    }

    @GetMapping({"/view", "/view/"})
    public String viewBookNoId(RedirectAttributes redirectAttributes) {
        redirectAttributes.addFlashAttribute("errorMessage", "Vui lòng chọn sách để xem chi tiết!");
        return "redirect:/books";
    }

    @GetMapping("/view/{id}")
    public String viewBook(@PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        return bookService.getBookById(id)
                .map(book -> {
                    model.addAttribute("book", book);
                    return "book/view";
                })
                .orElseGet(() -> {
                    redirectAttributes.addFlashAttribute("errorMessage", "Không tìm thấy sách!");
                    return "redirect:/books";
                });
    }
}
