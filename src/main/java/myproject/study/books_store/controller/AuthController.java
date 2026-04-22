package myproject.study.books_store.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import myproject.study.books_store.model.User;
import myproject.study.books_store.service.UserService;

@Controller
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/")
    public String index() {
        return "redirect:/books";
    }

    @GetMapping("/login")
    public String loginPage(@RequestParam(required = false) String error,
                           @RequestParam(required = false) String logout,
                           Model model) {
        if (error != null) {
            model.addAttribute("errorMessage", "Tên đăng nhập hoặc mật khẩu không đúng!");
        }
        if (logout != null) {
            model.addAttribute("successMessage", "Đăng xuất thành công!");
        }
        return "login";
    }

    @GetMapping("/register")
    public String registerPage(Model model) {
        model.addAttribute("user", new User());
        return "register";
    }

    @PostMapping("/register")
    public String registerUser(@ModelAttribute User user,
                              Model model,
                              RedirectAttributes redirectAttributes) {
        if (userService.checkUsernameExists(user.getUsername())) {
            model.addAttribute("usernameError", "Tên đăng nhập đã tồn tại!");
            model.addAttribute("user", user);
            return "register";
        }
        if (userService.checkEmailExists(user.getEmail())) {
            model.addAttribute("emailError", "Email đã được sử dụng!");
            model.addAttribute("user", user);
            return "register";
        }

        userService.createUser(user);
        redirectAttributes.addFlashAttribute("successMessage", "Đăng ký thành công! Vui lòng đăng nhập.");
        return "redirect:/login";
    }

    @GetMapping("/oauth2/success")
    public String oauth2Success(Authentication authentication, RedirectAttributes redirectAttributes) {
        if (authentication != null && authentication.getPrincipal() instanceof OAuth2User) {
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
            String email = oAuth2User.getAttribute("email");
            String name = oAuth2User.getAttribute("name");
            String googleId = oAuth2User.getName();

            userService.findOrCreateOAuthUser(email, name, googleId);
            redirectAttributes.addFlashAttribute("successMessage", "Đăng nhập bằng Google thành công!");
        }
        return "redirect:/books";
    }

    @GetMapping("/user/profile")
    public String userProfile(Authentication authentication, Model model) {
        if (authentication != null && authentication.getPrincipal() instanceof OAuth2User) {
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
            String email = oAuth2User.getAttribute("email");
            String name = oAuth2User.getAttribute("name");

            // Build a local User object so the existing user/profile template can be reused
            User oauthUser = new User();
            oauthUser.setUsername(email != null ? email : oAuth2User.getName());
            oauthUser.setEmail(email != null ? email : oAuth2User.getName());
            oauthUser.setFullName(name != null ? name : oauthUser.getUsername());
            oauthUser.setActive(true);

            model.addAttribute("user", oauthUser);
            return "user/profile";
        }
        
        if (authentication != null) {
            String username = authentication.getName();
            userService.findByUsername(username).ifPresent(user -> model.addAttribute("user", user));
        }
        return "user/profile";
    }

    @GetMapping("/access-denied")
    public String accessDenied() {
        return "access-denied";
    }
}
