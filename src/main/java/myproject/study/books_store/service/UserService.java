package myproject.study.books_store.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import myproject.study.books_store.model.Role;
import myproject.study.books_store.model.User;
import myproject.study.books_store.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Random;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private final Map<String, String> passwordResetOtps = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> passwordResetExpiry = new ConcurrentHashMap<>();

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public User createUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRoles(Set.of(Role.ROLE_USER));
        user.setActive(true);
        return userRepository.save(user);
    }

    public User createAdmin(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRoles(Set.of(Role.ROLE_USER, Role.ROLE_ADMIN));
        user.setActive(true);
        return userRepository.save(user);
    }

    public boolean checkUsernameExists(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean checkEmailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    // Hỗ trợ OAuth2 Google
    public User findOrCreateOAuthUser(String email, String name, String googleId) {
        Optional<User> existingUser = userRepository.findByEmail(email);
        
        if (existingUser.isPresent()) {
            return existingUser.get();
        }

        // Tạo user mới từ Google
        User newUser = new User();
        newUser.setEmail(email);
        newUser.setFullName(name);
        newUser.setUsername(email.split("@")[0] + "_" + System.currentTimeMillis());
        newUser.setPassword(""); // OAuth2 không cần password
        newUser.setRoles(Set.of(Role.ROLE_USER));
        newUser.setActive(true);
        
        return userRepository.save(newUser);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public java.util.List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void updateUserRole(String userId, java.util.Set<Role> roles) {
        userRepository.findById(Long.parseLong(userId)).ifPresent(user -> {
            user.setRoles(roles);
            userRepository.save(user);
        });
    }

    public void deactivateUser(String userId) {
        userRepository.findById(Long.parseLong(userId)).ifPresent(user -> {
            user.setActive(false);
            userRepository.save(user);
        });
    }

    public void activateUser(String userId) {
        userRepository.findById(Long.parseLong(userId)).ifPresent(user -> {
            user.setActive(true);
            userRepository.save(user);
        });
    }

    public void deleteUser(String userId) {
        userRepository.deleteById(Long.parseLong(userId));
    }

    public String requestPasswordReset(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Email không tồn tại!");
        }

        String otp = String.format("%06d", new Random().nextInt(999999));
        passwordResetOtps.put(email, otp);
        passwordResetExpiry.put(email, LocalDateTime.now().plusMinutes(5));
        emailService.sendPasswordResetOtp(email, otp);
        return otp;
    }

    public boolean resetPassword(String email, String otp, String newPassword) {
        String savedOtp = passwordResetOtps.get(email);
        LocalDateTime expiry = passwordResetExpiry.get(email);

        if (savedOtp == null || expiry == null || LocalDateTime.now().isAfter(expiry)) {
            return false;
        }

        if (!savedOtp.equals(otp)) {
            return false;
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        passwordResetOtps.remove(email);
        passwordResetExpiry.remove(email);
        return true;
    }
}
