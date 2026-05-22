package myproject.study.books_store.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import myproject.study.books_store.model.Role;
import myproject.study.books_store.service.UserService;

import java.util.Set;

@Controller
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public String adminDashboard(Model model) {
        model.addAttribute("totalUsers", userService.getAllUsers().size());
        return "admin/dashboard";
    }

    @GetMapping("/users")
    public String manageUsers(Model model) {
        model.addAttribute("users", userService.getAllUsers());
        return "admin/users";
    }

    @PostMapping("/users/{userId}/role")
    public String updateUserRole(@PathVariable String userId,
                                 @RequestParam String role,
                                 RedirectAttributes redirectAttributes) {
        try {
            Set<Role> roles;
            if ("ADMIN".equals(role)) {
                roles = Set.of(Role.ROLE_USER, Role.ROLE_ADMIN);
            } else {
                roles = Set.of(Role.ROLE_USER);
            }
            userService.updateUserRole(userId, roles);
            redirectAttributes.addFlashAttribute("successMessage", "Cập nhật quyền người dùng thành công!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi khi cập nhật quyền: " + e.getMessage());
        }
        return "redirect:/admin/users";
    }

    @PostMapping("/users/{userId}/activate")
    public String activateUser(@PathVariable String userId, RedirectAttributes redirectAttributes) {
        try {
            userService.activateUser(userId);
            redirectAttributes.addFlashAttribute("successMessage", "Kích hoạt người dùng thành công!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi khi kích hoạt người dùng!");
        }
        return "redirect:/admin/users";
    }

    @PostMapping("/users/{userId}/deactivate")
    public String deactivateUser(@PathVariable String userId, RedirectAttributes redirectAttributes) {
        try {
            userService.deactivateUser(userId);
            redirectAttributes.addFlashAttribute("successMessage", "Vô hiệu hóa người dùng thành công!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi khi vô hiệu hóa người dùng!");
        }
        return "redirect:/admin/users";
    }

    @GetMapping("/users/{userId}/delete")
    public String deleteUser(@PathVariable String userId, RedirectAttributes redirectAttributes) {
        try {
            userService.deleteUser(userId);
            redirectAttributes.addFlashAttribute("successMessage", "Xóa người dùng thành công!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi khi xóa người dùng!");
        }
        return "redirect:/admin/users";
    }
}
