import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";

import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import EmployeeDashboard from "@/pages/employee/EmployeeDashboard";
import ManagerDashboard from "@/pages/manager/ManagerDashboard";
import ExpenseDetail from "@/pages/expenses/ExpenseDetail";
import Settings from "@/pages/settings/Settings";

const queryClient = new QueryClient();

// Redirects to login if not authenticated, or to home if wrong role
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const role = user.role?.toLowerCase();

  if (allowedRoles && !allowedRoles.includes(role)) {
    const HOME = {
      admin: "/admin",
      manager: "/manager",
      employee: "/employee",
    };

    return <Navigate to={HOME[role] || "/login"} replace />;
  }

  return children;
}

// Redirect "/" based on logged-in role
function RootRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const role = user.role?.toLowerCase();

  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "manager") return <Navigate to="/manager" replace />;
  return <Navigate to="/employee" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected layout wrapper */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<RootRedirect />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager"
              element={
                <ProtectedRoute allowedRoles={["manager"]}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee"
              element={
                <ProtectedRoute allowedRoles={["employee"]}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />

            {/* Shared — any authenticated role */}
            <Route
              path="/expenses/:id"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager", "employee"]}>
                  <ExpenseDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager", "employee"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;