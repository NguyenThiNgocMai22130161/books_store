package myproject.study.books_store.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import myproject.study.books_store.model.Category;
import myproject.study.books_store.model.Role;
import myproject.study.books_store.model.User;
import myproject.study.books_store.repository.CategoryRepository;
import myproject.study.books_store.repository.UserRepository;

import java.util.Set;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initData(UserRepository userRepository, CategoryRepository categoryRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Initialize default category
            if (categoryRepository.findByIsDefaultTrue().isEmpty()) {
                Category uncategorized = new Category("Chưa phân loại", "Danh mục mặc định cho các sách chưa được phân loại", true);
                categoryRepository.save(uncategorized);
                System.out.println("Đã tạo danh mục mặc định: Chưa phân loại");
            }

            // Initialize some sample categories
            if (categoryRepository.count() == 1) {
                java.util.List<Category> sampleCategories = new java.util.ArrayList<>();
                sampleCategories.add(new Category("Tiểu thuyết", "Các tác phẩm tiểu thuyết"));
                sampleCategories.add(new Category("Khoa học", "Các sách về khoa học"));
                sampleCategories.add(new Category("Lịch sử", "Các sách về lịch sử"));
                sampleCategories.add(new Category("Kinh tế", "Các sách về kinh tế"));
                sampleCategories.add(new Category("Tâm lý", "Các sách về tâm lý học"));
                sampleCategories.add(new Category("Kỹ năng sống", "Các sách về kỹ năng sống"));
                categoryRepository.saveAll(sampleCategories);
                System.out.println("Đã tạo các danh mục mẫu");
            }

            if (!userRepository.existsByUsername("admin")) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin@example.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setFullName("Quản trị viên");
                admin.setRoles(Set.of(Role.ROLE_USER, Role.ROLE_ADMIN));
                userRepository.save(admin);
                System.out.println("Đã tạo tài khoản ADMIN: admin / admin123");
            }

            if (!userRepository.existsByUsername("user")) {
                User user = new User();
                user.setUsername("user");
                user.setEmail("user@example.com");
                user.setPassword(passwordEncoder.encode("user123"));
                user.setFullName("Người dùng thường");
                user.setRoles(Set.of(Role.ROLE_USER));
                userRepository.save(user);
                System.out.println("Đã tạo tài khoản USER: user / user123");
            }
        };
    }
}
