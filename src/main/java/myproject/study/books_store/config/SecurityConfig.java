package myproject.study.books_store.config;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpMethod;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletResponse;
import myproject.study.books_store.service.CustomOAuth2UserService;
import myproject.study.books_store.service.CustomUserDetailsService;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;

    @Autowired
    @Lazy
    private CustomOAuth2UserService customOAuth2UserService;

    public SecurityConfig(CustomUserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        AuthenticationManagerBuilder builder = http.getSharedObject(AuthenticationManagerBuilder.class);
        builder.userDetailsService(userDetailsService).passwordEncoder(passwordEncoder());
        return builder.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Cho phép React dev server và production
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:5173", // Vite dev server (PRIMARY)
                "http://localhost:5174",
                "http://localhost:3000", // Alternative React port
                "http://localhost:3001",
                "http://127.0.0.1:5173", // Localhost alternative
                "http://localhost:8080", // Spring Boot (nếu cần)
                "https://books-store-three-swart.vercel.app"
        ));

        // Cho phép tất cả HTTP methods cần thiết cho REST API
        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"
        ));

        // Cho phép tất cả headers
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // Cho phép gửi credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);

        // Expose headers cho client
        configuration.setExposedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "X-Total-Count"
        ));

        // Cache preflight request trong 1 giờ
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    @Order(2)
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Enable CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Disable CSRF cho REST API (React sẽ gửi token qua headers)
                .csrf(csrf -> csrf.disable())
                // Session management - sử dụng stateless cho REST API
                .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .maximumSessions(1)
                )
                // Authorization rules
                .authorizeHttpRequests(auth -> auth
                // Preflight CORS
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Public endpoints - không cần authentication
                .requestMatchers(
                        "/actuator/health",
                        "/api/auth/register",
                        "/api/auth/check-username",
                        "/api/auth/check-email",
                        "/api/auth/login",
                        "/oauth2/**",
                        "/login/oauth2/**",
                        "/api/books",
                        "/api/books/**", // Cho phép xem sách công khai
                        "/api/categories",
                        "/api/categories/**", // Cho phép xem danh mục công khai
                        "/api/reviews",
                        "/api/reviews/**",
                        "/api/cart/payment/vnpay-return",
                        "/api/cart/payment/vnpay-ipn"
                ).permitAll()
                // Static resources (nếu còn dùng)
                .requestMatchers("/css/**", "/js/**", "/images/**", "/uploads/**").permitAll()
                // API endpoints - cần authentication
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/cart/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/orders/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/wishlist/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/auth/profile").authenticated()
                // Tất cả requests khác cần authentication
                .anyRequest().authenticated()
                )
                // Form login cho REST API - trả về JSON thay vì redirect
                .formLogin(form -> form
                .loginProcessingUrl("/api/auth/login")
                .successHandler(authenticationSuccessHandler())
                .failureHandler(authenticationFailureHandler())
                .permitAll()
                )
                // OAuth2 login configuration
                .oauth2Login(oauth2 -> oauth2
                .loginProcessingUrl("/login/oauth2/code/*")
                .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                .successHandler(oauth2AuthenticationSuccessHandler())
                .failureHandler(oauth2AuthenticationFailureHandler())
                .permitAll()
                )
                // Logout configuration
                .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler((request, response, authentication) -> {
                    response.setStatus(HttpServletResponse.SC_OK);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write("{\"message\":\"Đăng xuất thành công!\"}");
                })
                .permitAll()
                )
                // Exception handling - trả về JSON thay vì redirect
                .exceptionHandling(ex -> ex
                // Xử lý khi chưa đăng nhập (401 Unauthorized)
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);

                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("error", "Unauthorized");
                    errorResponse.put("message", "Bạn cần đăng nhập để truy cập tài nguyên này");
                    errorResponse.put("path", request.getRequestURI());
                    errorResponse.put("status", 401);

                    ObjectMapper mapper = new ObjectMapper();
                    response.getWriter().write(mapper.writeValueAsString(errorResponse));
                })
                // Xử lý khi không có quyền truy cập (403 Forbidden)
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);

                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("error", "Forbidden");
                    errorResponse.put("message", "Bạn không có quyền truy cập tài nguyên này");
                    errorResponse.put("path", request.getRequestURI());
                    errorResponse.put("status", 403);

                    ObjectMapper mapper = new ObjectMapper();
                    response.getWriter().write(mapper.writeValueAsString(errorResponse));
                })
                );

        return http.build();
    }

    /**
     * Success handler cho form login - trả về JSON
     */
    @Bean
    public AuthenticationSuccessHandler authenticationSuccessHandler() {
        return (request, response, authentication) -> {
            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            Map<String, Object> data = new HashMap<>();
            data.put("success", true);
            data.put("message", "Đăng nhập thành công!");
            data.put("username", authentication.getName());
            data.put("authorities", authentication.getAuthorities());

            ObjectMapper mapper = new ObjectMapper();
            response.getWriter().write(mapper.writeValueAsString(data));
        };
    }

    /**
     * Failure handler cho form login - trả về JSON
     */
    @Bean
    public AuthenticationFailureHandler authenticationFailureHandler() {
        return (request, response, exception) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            Map<String, Object> data = new HashMap<>();
            data.put("success", false);
            data.put("message", "Tên đăng nhập hoặc mật khẩu không đúng!");
            data.put("error", exception.getMessage());

            ObjectMapper mapper = new ObjectMapper();
            response.getWriter().write(mapper.writeValueAsString(data));
        };
    }

    /**
     * Success handler cho OAuth2 login - redirect về React frontend
     */
    @Bean
    public AuthenticationSuccessHandler oauth2AuthenticationSuccessHandler() {
        return (request, response, authentication) -> {
            // Redirect về React frontend với token hoặc session
            String redirectUrl = "http://localhost:5173/oauth2/callback?success=true";
            response.sendRedirect(redirectUrl);
        };
    }

    /**
     * Failure handler cho OAuth2 login - redirect về React frontend
     */
    @Bean
    public AuthenticationFailureHandler oauth2AuthenticationFailureHandler() {
        return (request, response, exception) -> {
            // Redirect về React frontend với error
            String redirectUrl = "http://localhost:5173/login?error=oauth2_failed";
            response.sendRedirect(redirectUrl);
        };
    }
}
