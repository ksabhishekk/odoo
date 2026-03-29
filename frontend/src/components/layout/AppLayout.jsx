import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster"; 

export default function AppLayout() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar background gradient blob effect */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[128px] pointer-events-none -z-10 animate-pulse delay-75" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[128px] pointer-events-none -z-10 animate-pulse delay-300" />
      
      <Sidebar collapsed={collapsed} />
      
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <TopNav toggleSidebar={() => setCollapsed(!collapsed)} />
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}
