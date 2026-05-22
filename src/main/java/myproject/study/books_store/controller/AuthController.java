package myproject.study.books_store.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import myproject.study.books_store.model.User;
import myproject.study.books_store.service.UserService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            if (userService.checkUsernameExists(user.getUsername())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Tên đăng nhập đã tồn tại!"));
            }
            if (userService.checkEmailExists(user.getEmail())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Email đã được sử dụng!"));
            }

            User createdUser = userService.createUser(user);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Đăng ký thành công!", "user", createdUser));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi đăng ký: " + e.getMessage()));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> userProfile(Authentication authentication) {
        try {
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Chưa đăng nhập!"));
            }

            if (authentication.getPrincipal() instanceof OAuth2User) {
                OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
                String email = oAuth2User.getAttribute("email");
                String name = oAuth2User.getAttribute("name");

                Map<String, Object> profile = new HashMap<>();
                profile.put("username", email != null ? email : oAuth2User.getName());
                profile.put("email", email != null ? email : oAuth2User.getName());
                profile.put("fullName", name != null ? name : email);
                profile.put("active", true);
                profile.put("oauth", true);

                return ResponseEntity.ok(profile);
            }

            String username = authentication.getName();
            return userService.findByUsername(username)
                    .map(user -> ResponseEntity.ok((Object) user))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("error", "Không tìm thấy người dùng!")));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi tải profile: " + e.getMessage()));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> authStatus(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.ok(Map.of(
                "authenticated", false,
                "message", "Chưa đăng nhập"
            ));
        }

        Map<String, Object> status = new HashMap<>();
        status.put("authenticated", true);
        status.put("username", authentication.getName());
        status.put("authorities", authentication.getAuthorities());
        
        return ResponseEntity.ok(status);
    }

    @GetMapping("/check-username")
    public ResponseEntity<?> checkUsername(@RequestParam String username) {
        boolean exists = userService.checkUsernameExists(username);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        boolean exists = userService.checkEmailExists(email);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "Đăng xuất thành công!"));
    }
}
