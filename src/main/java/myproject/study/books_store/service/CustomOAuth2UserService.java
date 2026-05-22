package myproject.study.books_store.service;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import myproject.study.books_store.model.User;
import myproject.study.books_store.repository.UserRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomOAuth2UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        OAuth2User oauth2User = super.loadUser(userRequest);

        Map<String, Object> attributes = new HashMap<>(oauth2User.getAttributes());

        // Try to extract email (Google provides 'email')
        String email = (String) attributes.get("email");
        String name = (String) attributes.getOrDefault("name", (String) attributes.get("given_name"));

        // Make a final/effectively-final email value for use in lambdas
        String userEmail = (email == null || email.trim().isEmpty()) ? (String) attributes.get("sub") : email;

        // Find or create local user
        User user = userRepository.findByEmail(userEmail).orElseGet(() -> {
            User u = new User();
            u.setEmail(userEmail);
            u.setUsername(userEmail);
            u.setFullName(name != null ? name : userEmail);
            // set a random password (not used for OAuth login)
            u.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            // constructor of User adds ROLE_USER by default
            return userRepository.save(u);
        });

        // Map roles to authorities
        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.name()))
                .collect(Collectors.toList());

        // Always use email as the principal name for consistency with local lookups
        return new DefaultOAuth2User(authorities, attributes, "email");
    }
}
