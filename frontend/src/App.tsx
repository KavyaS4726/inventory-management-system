import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProductsSection from "./pages/ProductsSection";
import CategoriesSection from "./pages/CategoriesSection";
import SuppliersSection from "./pages/SuppliersSection";
import StockMovementsSection from "./pages/StockMovementsSection";
import UsersSection from "./pages/UsersSection";
import Profile from "./pages/Profile";
import Layout from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import BuyersSection from "./pages/BuyersSection";
import OrdersSection from "./pages/OrdersSection";
import PermissionRoute from "./components/PermissionRoute";
import RolesPermissions from "./pages/RolesPermissions";

function App() {
  const { token } = useAuth();

  if (!token) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              <PermissionRoute module="dashboard">
                <Dashboard />
              </PermissionRoute>
            }
          />
          <Route
            path="/products"
            element={
              <PermissionRoute module="products">
                <ProductsSection />
              </PermissionRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <PermissionRoute module="categories">
                <CategoriesSection />
              </PermissionRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <PermissionRoute module="suppliers">
                <SuppliersSection />
              </PermissionRoute>
            }
          />
          <Route
            path="/stock-movements"
            element={
              <PermissionRoute module="stockMovements">
                <StockMovementsSection />
              </PermissionRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PermissionRoute module="users">
                <UsersSection />
              </PermissionRoute>
            }
          />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/buyers"
            element={
              <PermissionRoute module="buyers">
                <BuyersSection />
              </PermissionRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <PermissionRoute module="orders">
                <OrdersSection />
              </PermissionRoute>
            }
          />
          <Route
            path="/roles-permissions"
            element={
              <PermissionRoute module="roles">
                <RolesPermissions />
              </PermissionRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;