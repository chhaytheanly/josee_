import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Home, Receipt, Moon, Sun, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../store/useAuth';
import { Button } from '../ui/button';

export function DashboardLayout() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Rooms', path: '/rooms', icon: Home },
    { name: 'Tenants', path: '/tenants', icon: Users },
    { name: 'Users', path: '/users', icon: ShieldAlert },
    { name: 'Invoices', path: '/invoices', icon: Receipt },
  ];

  const getRoleLabel = () => {
    if (typeof user?.role === 'number') {
      const roleMap: Record<number, string> = { 1: 'Administrator', 2: 'Manager', 3: 'Staff' };
      return roleMap[user.role] || 'User';
    }
    return user?.role ? String(user.role).charAt(0).toUpperCase() + String(user.role).slice(1) : 'User';
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-border/50 bg-card/50 dark:bg-slate-900/50 backdrop-blur-sm flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Admin</h1>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50 space-y-3">
          <div className="px-3 py-2 rounded-lg bg-muted/30">
            <p className="text-sm font-medium">Admin User</p>
            <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={logout}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-6 border-b border-border/50 bg-card/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <h2 className="text-lg font-semibold">
            {navItems.find((n) => n.path === location.pathname)?.name || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDark(!isDark)}
              className="relative overflow-hidden transition-all duration-300 hover:bg-muted"
            >
              <div className="relative">
                <Moon 
                  size={18} 
                  className={`transition-all duration-300 absolute ${
                    isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
                  }`}
                />
                <Sun 
                  size={18} 
                  className={`transition-all duration-300 ${
                    isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
                  }`}
                />
              </div>
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 bg-gradient-to-br from-background to-muted/20">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
