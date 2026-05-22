package myproject.study.books_store.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import myproject.study.books_store.model.Role;
import myproject.study.books_store.model.User;
import myproject.study.books_store.service.UserService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> adminDashboard() {
        try {
            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("totalUsers", userService.getAllUsers().size());
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi tải dashboard: " + e.getMessage()));
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> manageUsers() {
        try {
            List<User> users = userService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi tải danh sách người dùng: " + e.getMessage()));
        }
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable String userId,
                                           @RequestBody Map<String, String> request) {
        try {
            String role = request.get("role");
            Set<Role> roles;
            if ("ADMIN".equals(role)) {
                roles = Set.of(Role.ROLE_USER, Role.ROLE_ADMIN);
            } else {
                roles = Set.of(Role.ROLE_USER);
            }
            userService.updateUserRole(userId, roles);
            return ResponseEntity.ok(Map.of("message", "Cập nhật quyền người dùng thành công!"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Lỗi khi cập nhật quyền: " + e.getMessage()));
        }
    }

    @PutMapping("/users/{userId}/activate")
    public ResponseEntity<?> activateUser(@PathVariable String userId) {
        try {
            userService.activateUser(userId);
            return ResponseEntity.ok(Map.of("message", "Kích hoạt người dùng thành công!"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Lỗi khi kích hoạt người dùng: " + e.getMessage()));
        }
    }

    @PutMapping("/users/{userId}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable String userId) {
        try {
            userService.deactivateUser(userId);
            return ResponseEntity.ok(Map.of("message", "Vô hiệu hóa người dùng thành công!"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Lỗi khi vô hiệu hóa người dùng: " + e.getMessage()));
        }
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable String userId) {
        try {
            userService.deleteUser(userId);
            return ResponseEntity.ok(Map.of("message", "Xóa người dùng thành công!"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Lỗi khi xóa người dùng: " + e.getMessage()));
        }
    }
}
