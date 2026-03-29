import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Receipt, Users, Settings, LogOut, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_LINKS = {
  ADMIN: [
    { name: "Overview", path: "/admin", icon: LayoutDashboard },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Rules", path: "/admin/rules", icon: Settings },
  ],
  MANAGER: [
    { name: "Approvals", path: "/manager", icon: CheckSquare },
  ],
  EMPLOYEE: [
    { name: "My Expenses", path: "/employee", icon: Receipt },
  ],
};

export default function Sidebar({ collapsed }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const links = ROLE_LINKS[user.role] || [];
  const bottomLinks = [
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "h-screen glass-panel flex flex-col transition-all duration-300 z-20",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="h-16 flex items-center justify-center border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
            R
          </div>
          {!collapsed && <span className="font-heading font-bold text-lg tracking-wide text-white">Reimbursify</span>}
        </div>
      </div>

      <nav className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto">
        <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 px-3">
          {!collapsed && "Menu"}
        </div>
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-primary/20 text-primary font-medium"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                <link.icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-primary drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" : "text-white/50"
                  )}
                />
                {!collapsed && <span>{link.name}</span>}
                {isActive && !collapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 shrink-0">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/70 hover:bg-destructive/10 hover:text-destructive w-full group"
        >
          <LogOut className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
