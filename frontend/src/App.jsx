import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";

// auth
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";

// admin
import AdminDashboard from "@/pages/admin/AdminDashboard";

// employee
import EmployeeDashboard from "@/pages/employee/EmployeeDashboard";

// manager
import ManagerDashboard from "@/pages/manager/ManagerDashboard";

// shared
import ExpenseDetail from "@/pages/expenses/ExpenseDetail";
import Settings from "@/pages/settings/Settings";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/employee" replace />} />
            
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/employee" element={<EmployeeDashboard />} />
            <Route path="/manager" element={<ManagerDashboard />} />
            
            <Route path="/expenses/:id" element={<ExpenseDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
