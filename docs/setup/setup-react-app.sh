#!/bin/bash

# Script tự động setup React App cho Books Store
# Author: Kiro AI Assistant
# Date: May 20, 2026

echo "🚀 =========================================="
echo "   SETUP REACT APP FOR BOOKS STORE"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"
echo -e "${GREEN}✅ npm version: $(npm -v)${NC}"
echo ""

# Step 1: Create React App with Vite
echo "📦 Step 1: Creating React App with Vite..."
npm create vite@latest frontend -- --template react

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to create React app${NC}"
    exit 1
fi

echo -e "${GREEN}✅ React app created${NC}"
echo ""

# Step 2: Install dependencies
echo "📦 Step 2: Installing dependencies..."
cd frontend

npm install
npm install react-router-dom axios

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 3: Create components folder
echo "📁 Step 3: Creating components folder..."
mkdir -p src/components

echo -e "${GREEN}✅ Components folder created${NC}"
echo ""

# Step 4: Copy React components
echo "📁 Step 4: Copying React components..."

# Copy JSX files
cp ../react-components/*.jsx src/components/ 2>/dev/null
jsx_count=$(ls -1 ../react-components/*.jsx 2>/dev/null | wc -l)

# Copy CSS files
cp ../react-components/*.css src/components/ 2>/dev/null
css_count=$(ls -1 ../react-components/*.css 2>/dev/null | wc -l)

echo -e "${GREEN}✅ Copied $jsx_count JSX files${NC}"
echo -e "${GREEN}✅ Copied $css_count CSS files${NC}"
echo ""

# Step 5: Create .env file
echo "⚙️  Step 5: Creating .env file..."
cat > .env << 'EOF'
VITE_API_URL=http://localhost:8080
EOF

echo -e "${GREEN}✅ .env file created${NC}"
echo ""

# Step 6: Create App.jsx with routes
echo "⚙️  Step 6: Creating App.jsx with routes..."
cat > src/App.jsx << 'EOF'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Auth
import Login from './components/Login';
import Register from './components/Register';
import UserProfile from './components/UserProfile';

// Books
import BookList from './components/BookList';
import BookDetail from './components/BookDetail';
import BookForm from './components/BookForm';

// Shopping
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import PaymentResult from './components/PaymentResult';

// Orders
import OrderList from './components/OrderList';
import OrderDetail from './components/OrderDetail';

// Admin
import AdminDashboard from './components/AdminDashboard';
import AdminUsers from './components/AdminUsers';

// Categories
import CategoryList from './components/CategoryList';
import CategoryForm from './components/CategoryForm';

// Error
import AccessDenied from './components/AccessDenied';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          {/* Home */}
          <Route path="/" element={<Navigate to="/books" replace />} />
          
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/user/profile" element={<UserProfile />} />
          
          {/* Books */}
          <Route path="/books" element={<BookList />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/books/add" element={<BookForm />} />
          <Route path="/books/edit/:id" element={<BookForm />} />
          
          {/* Shopping */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment-result" element={<PaymentResult />} />
          
          {/* Orders */}
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          
          {/* Admin */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          
          {/* Categories */}
          <Route path="/categories" element={<CategoryList />} />
          <Route path="/categories/add" element={<CategoryForm />} />
          <Route path="/categories/edit/:id" element={<CategoryForm />} />
          
          {/* Error */}
          <Route path="/access-denied" element={<AccessDenied />} />
          
          {/* 404 */}
          <Route path="*" element={<Navigate to="/books" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
EOF

echo -e "${GREEN}✅ App.jsx created with all routes${NC}"
echo ""

# Step 7: Update vite.config.js
echo "⚙️  Step 7: Configuring Vite proxy..."
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
EOF

echo -e "${GREEN}✅ Vite config updated${NC}"
echo ""

# Step 8: Create README for frontend
echo "📝 Step 8: Creating frontend README..."
cat > README.md << 'EOF'
# Books Store - React Frontend

## 🚀 Quick Start

### Development
```bash
npm run dev
```

Frontend will run on: http://localhost:3000

### Build for Production
```bash
npm run build
```

## 📦 Dependencies

- React 18
- React Router v6
- Axios
- Vite

## 🔌 API Configuration

Backend API: http://localhost:8080

Configure in `.env`:
```
VITE_API_URL=http://localhost:8080
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/     # All React components
│   ├── App.jsx        # Main app with routes
│   └── main.jsx       # Entry point
├── .env               # Environment variables
└── vite.config.js     # Vite configuration
```

## 🧪 Testing

1. Make sure backend is running on port 8080
2. Run frontend: `npm run dev`
3. Open browser: http://localhost:3000

## 📚 Available Routes

- `/` - Home (redirects to /books)
- `/login` - Login page
- `/register` - Register page
- `/books` - Books list
- `/books/:id` - Book details
- `/cart` - Shopping cart
- `/checkout` - Checkout
- `/orders` - Order history
- `/admin/dashboard` - Admin dashboard
- `/categories` - Categories management

EOF

echo -e "${GREEN}✅ Frontend README created${NC}"
echo ""

# Final message
echo ""
echo "🎉 =========================================="
echo "   SETUP COMPLETE!"
echo "=========================================="
echo ""
echo -e "${GREEN}✅ React app is ready!${NC}"
echo ""
echo "📍 Location: $(pwd)"
echo ""
echo "🚀 Next steps:"
echo ""
echo "1️⃣  Start Backend (in another terminal):"
echo "   cd .."
echo "   ./mvnw spring-boot:run"
echo "   (Backend will run on http://localhost:8080)"
echo ""
echo "2️⃣  Start Frontend (in this terminal):"
echo "   npm run dev"
echo "   (Frontend will run on http://localhost:3000)"
echo ""
echo "3️⃣  Open browser:"
echo "   http://localhost:3000"
echo ""
echo -e "${YELLOW}⚠️  Make sure backend is running before testing frontend!${NC}"
echo ""
echo "📚 For more info, read:"
echo "   - frontend/README.md"
echo "   - ../SETUP_REACT_APP.md"
echo ""
echo "Happy coding! 🎊"
echo ""
