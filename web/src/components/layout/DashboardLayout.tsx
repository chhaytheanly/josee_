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

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <h1 className="text-lg font-bold">AdminUI</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={logout}>
            <LogOut size={18} /> Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/50">
          <h2 className="text-lg font-semibold capitalize">{navItems.find((n) => n.path === location.pathname)?.name || 'Dashboard'}</h2>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsDark(!isDark)}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <div className="text-right">
              <p className="text-sm font-medium">{user?.role || 'Admin'}</p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 bg-muted/10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
