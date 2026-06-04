import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import Scan from './pages/Scan';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import AdminDashboard from './pages/AdminDashboard';

const AppLayout = ({ children }) => (
  <div className="min-h-screen">
    <Navbar />
    <main className="animate-fade-in">{children}</main>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
              duration: 3000,
            }}
          />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected user routes */}
            <Route path="/products" element={
              <ProtectedRoute>
                <AppLayout><Products /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/scan" element={
              <ProtectedRoute>
                <AppLayout><Scan /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/cart" element={
              <ProtectedRoute>
                <AppLayout><Cart /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <AppLayout><Orders /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Admin-only routes */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AppLayout><AdminDashboard /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="*" element={<Navigate to="/products" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
