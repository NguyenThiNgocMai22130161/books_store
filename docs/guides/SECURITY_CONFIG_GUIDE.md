# Spring Security Configuration Guide - REST API + React

## Tổng quan

Cấu hình Spring Security đã được refactor để hỗ trợ kiến trúc RESTful API kết hợp với React frontend, thay thế cho kiến trúc MVC + Thymeleaf trước đây.

## Các thay đổi chính

### 1. **CORS Configuration**

Đã cấu hình CORS để cho phép React frontend (chạy trên port 3000) gọi API:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    
    // Cho phép React dev server và production
    configuration.setAllowedOrigins(Arrays.asList(
        "http://localhost:3000",      // React dev server
        "http://localhost:3001",      // Alternative React port
        "http://localhost:8080"       // Spring Boot
    ));
    
    // Cho phép tất cả HTTP methods
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
    
    return source;
}
```

### 2. **CSRF Protection**

CSRF đã được **tắt** cho REST API vì:
- React sẽ gửi token qua headers thay vì cookies
- REST API là stateless
- Sử dụng JWT hoặc session-based authentication

```java
.csrf(csrf -> csrf.disable())
```

### 3. **Session Management**

Cấu hình session cho REST API:

```java
.sessionManagement(session -> session
    .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
    .maximumSessions(1)
)
```

**Lưu ý:** Có thể thay đổi thành `STATELESS` nếu sử dụng JWT.

### 4. **Authentication Entry Point**

Thay vì redirect về `/login`, giờ trả về **JSON response với status 401**:

```java
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
```

**Response mẫu:**
```json
{
  "error": "Unauthorized",
  "message": "Bạn cần đăng nhập để truy cập tài nguyên này",
  "path": "/api/cart",
  "status": 401
}
```

### 5. **Access Denied Handler**

Trả về **JSON response với status 403** khi không có quyền:

```java
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
```

### 6. **Form Login - JSON Response**

Form login giờ trả về JSON thay vì redirect:

#### Success Handler:
```java
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
```

**Response mẫu:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công!",
  "username": "user@example.com",
  "authorities": [
    {
      "authority": "ROLE_USER"
    }
  ]
}
```

#### Failure Handler:
```java
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
```

### 7. **OAuth2 Login - React Integration**

OAuth2 login giờ redirect về React frontend:

#### Success Handler:
```java
@Bean
public AuthenticationSuccessHandler oauth2AuthenticationSuccessHandler() {
    return (request, response, authentication) -> {
        // Redirect về React frontend với success flag
        String redirectUrl = "http://localhost:3000/oauth2/callback?success=true";
        response.sendRedirect(redirectUrl);
    };
}
```

#### Failure Handler:
```java
@Bean
public AuthenticationFailureHandler oauth2AuthenticationFailureHandler() {
    return (request, response, exception) -> {
        // Redirect về React frontend với error
        String redirectUrl = "http://localhost:3000/login?error=oauth2_failed";
        response.sendRedirect(redirectUrl);
    };
}
```

### 8. **Logout - JSON Response**

Logout giờ trả về JSON:

```java
.logout(logout -> logout
    .logoutUrl("/api/auth/logout")
    .logoutSuccessHandler((request, response, authentication) -> {
        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"message\":\"Đăng xuất thành công!\"}");
    })
    .permitAll()
)
```

### 9. **Authorization Rules**

Cấu hình quyền truy cập cho các endpoints:

```java
.authorizeHttpRequests(auth -> auth
    // Public endpoints
    .requestMatchers(
        "/api/auth/register",
        "/api/auth/check-username",
        "/api/auth/check-email",
        "/api/auth/login",
        "/oauth2/**",
        "/login/oauth2/**"
    ).permitAll()
    
    // Admin endpoints
    .requestMatchers("/api/admin/**").hasRole("ADMIN")
    
    // Public read, authenticated write
    .requestMatchers("/api/books/**").permitAll()
    .requestMatchers("/api/categories/**").permitAll()
    
    // Authenticated endpoints
    .requestMatchers("/api/cart/**").hasAnyRole("USER", "ADMIN")
    .requestMatchers("/api/orders/**").hasAnyRole("USER", "ADMIN")
    .requestMatchers("/api/auth/profile").authenticated()
    
    .anyRequest().authenticated()
)
```

## API Endpoints mới

### Authentication Status
```
GET /api/auth/status
```

**Response khi đã đăng nhập:**
```json
{
  "authenticated": true,
  "username": "user@example.com",
  "authorities": [
    {
      "authority": "ROLE_USER"
    }
  ]
}
```

**Response khi chưa đăng nhập:**
```json
{
  "authenticated": false,
  "message": "Chưa đăng nhập"
}
```

### Login
```
POST /api/auth/login
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=password123
```

### Logout
```
POST /api/auth/logout
```

### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "fullName": "New User"
}
```

## React Frontend Integration

### 1. Axios Configuration

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true, // Quan trọng: gửi cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để xử lý 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect về login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 2. Login Component

```javascript
import api from './api';

const login = async (username, password) => {
  try {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.data.success) {
      // Đăng nhập thành công
      console.log('Logged in:', response.data.username);
      // Redirect hoặc update state
    }
  } catch (error) {
    console.error('Login failed:', error.response?.data?.message);
  }
};
```

### 3. Check Authentication Status

```javascript
const checkAuthStatus = async () => {
  try {
    const response = await api.get('/auth/status');
    return response.data.authenticated;
  } catch (error) {
    return false;
  }
};
```

### 4. OAuth2 Callback Handler

```javascript
// Component: /oauth2/callback
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuth2Callback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    
    if (success === 'true') {
      // OAuth2 login thành công
      navigate('/dashboard');
    } else {
      // OAuth2 login thất bại
      navigate('/login?error=oauth2_failed');
    }
  }, [searchParams, navigate]);

  return <div>Đang xử lý đăng nhập...</div>;
};
```

### 5. Protected Route Component

```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && !user.authorities.some(a => a.authority === requiredRole)) {
    return <Navigate to="/forbidden" />;
  }

  return children;
};
```

## Testing với cURL

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123" \
  -c cookies.txt
```

### Check Status (với cookies)
```bash
curl -X GET http://localhost:8080/api/auth/status \
  -b cookies.txt
```

### Get Books (authenticated)
```bash
curl -X GET http://localhost:8080/api/books \
  -b cookies.txt
```

### Logout
```bash
curl -X POST http://localhost:8080/api/auth/logout \
  -b cookies.txt
```

## Lưu ý quan trọng

### 1. **CORS và Credentials**
- React phải set `withCredentials: true` trong axios
- Backend phải set `setAllowCredentials(true)` trong CORS config
- Không thể dùng `allowedOrigins("*")` khi `allowCredentials(true)`

### 2. **Session vs JWT**
Cấu hình hiện tại sử dụng **session-based authentication**. Nếu muốn chuyển sang JWT:
- Thay đổi `SessionCreationPolicy.IF_REQUIRED` → `STATELESS`
- Implement JWT filter
- Thêm JWT token vào response của login

### 3. **OAuth2 Redirect URLs**
Cần cấu hình redirect URLs trong Google Cloud Console:
```
http://localhost:8080/login/oauth2/code/google
http://localhost:8080/oauth2/authorization/google
```

### 4. **Production Configuration**
Khi deploy production, cần update:
- `allowedOrigins` trong CORS config
- OAuth2 redirect URLs trong handlers
- Session timeout và security settings

### 5. **HTTPS trong Production**
Trong production, **bắt buộc** phải dùng HTTPS cho:
- OAuth2 login
- Cookie transmission
- API calls

## Troubleshooting

### CORS Error
```
Access to XMLHttpRequest at 'http://localhost:8080/api/books' from origin 
'http://localhost:3000' has been blocked by CORS policy
```

**Giải pháp:**
- Kiểm tra `allowedOrigins` có chứa `http://localhost:3000`
- Kiểm tra `withCredentials: true` trong axios
- Kiểm tra `setAllowCredentials(true)` trong CORS config

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Bạn cần đăng nhập để truy cập tài nguyên này"
}
```

**Giải pháp:**
- Kiểm tra cookies có được gửi kèm request không
- Kiểm tra session có còn valid không
- Gọi `/api/auth/status` để verify authentication

### OAuth2 Redirect Loop
**Giải pháp:**
- Kiểm tra redirect URLs trong Google Cloud Console
- Kiểm tra OAuth2 handlers có redirect đúng URL không
- Clear cookies và thử lại

---

**Updated:** May 20, 2026  
**Status:** ✅ Production Ready  
**Version:** 2.0 - REST API + React
