# 📱 Frontend - Tiệm Sách

> React + Vite application for Bookstore Management System

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📂 Project Structure

```
frontend/
├── src/
│   ├── components/          # React components (organized by feature)
│   │   ├── auth/           # Authentication
│   │   ├── books/          # Book management
│   │   ├── cart/           # Shopping cart & payment
│   │   ├── orders/         # Order management
│   │   ├── admin/          # Admin dashboard
│   │   ├── categories/     # Category management
│   │   ├── user/           # User profile
│   │   └── shared/         # Shared components (Navbar, Footer)
│   ├── assets/             # Images, fonts
│   ├── App.jsx             # Main app component
│   ├── App.css             # Global styles
│   └── main.jsx            # Entry point
├── public/                 # Static assets
├── package.json
└── vite.config.js
```

**Chi tiết**: Xem [FRONTEND_STRUCTURE.md](FRONTEND_STRUCTURE.md)

## 🛠️ Tech Stack

- **Framework**: React 18.x
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Styling**: CSS3 (Custom)

## 🔗 API Integration

Backend API: `http://localhost:8080/api`

### Configuration

Update API base URL in components if needed:
```javascript
axios.get('http://localhost:8080/api/books')
```

## 📝 Available Scripts

- `npm run dev` - Start development server (port 5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Styling

- Global styles: `src/App.css`, `src/index.css`
- Component styles: Co-located with components (e.g., `BookList.css`)
- Responsive design: Mobile-first approach
- Wide screen support: Up to 2200px

## 🔐 Authentication

- Session-based authentication
- Credentials sent with `withCredentials: true`
- Auto-redirect to `/login` on 401

## 📦 Adding New Components

See [FRONTEND_STRUCTURE.md](FRONTEND_STRUCTURE.md) for detailed guide.

Quick example:
```javascript
// 1. Create component in appropriate module
// src/components/books/NewComponent.jsx

// 2. Export from index.js
// src/components/books/index.js
export { default as NewComponent } from './NewComponent';

// 3. Import in App.jsx
import { NewComponent } from './components/books';
```

## 🐛 Troubleshooting

### Port 5173 already in use
```bash
lsof -i :5173
kill -9 <PID>
```

### Cannot connect to backend
- Check backend is running on port 8080
- Check CORS configuration in backend
- Check `withCredentials: true` in axios calls

### Build errors
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Documentation

- [Frontend Structure](FRONTEND_STRUCTURE.md) - Detailed structure guide
- [Main README](../README.md) - Project documentation
- [Payment Guide](../PAYMENT_TEST_GUIDE.md) - Payment testing

## 🤝 Contributing

1. Follow the existing folder structure
2. Use functional components with hooks
3. Co-locate CSS with components
4. Export from index.js files
5. Update documentation when adding features

---

**Last Updated**: May 22, 2026
