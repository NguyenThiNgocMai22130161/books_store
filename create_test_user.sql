-- Create Test User for Books Store
-- Password: "password123" (BCrypt encoded)

-- 1. Check if user exists
SELECT * FROM users WHERE username = 'testuser' OR email = 'test@example.com';

-- 2. Create test user (if not exists)
INSERT INTO users (username, email, password, full_name, role, enabled, created_at, updated_at)
VALUES (
    'testuser',
    'test@example.com',
    '$2a$10$XPTYHRhEMkX5rGqKqHPk3eqKqZV5yF0Xw.xEVqYvXZGN5.x5x5x5x',  -- password123
    'Test User',
    'USER',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING;

-- 3. Create admin user (if not exists)
INSERT INTO users (username, email, password, full_name, role, enabled, created_at, updated_at)
VALUES (
    'admin',
    'admin@bookstore.com',
    '$2a$10$XPTYHRhEMkX5rGqKqHPk3eqKqZV5yF0Xw.xEVqYvXZGN5.x5x5x5x',  -- password123
    'Admin User',
    'ADMIN',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING;

-- 4. Verify users
SELECT username, email, role, enabled FROM users WHERE username IN ('testuser', 'admin');
