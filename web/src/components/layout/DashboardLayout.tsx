import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Home, Receipt, Moon, Sun, LogOut, ShieldAlert, ChevronRight } from 'lucide-react';
import { useAuth } from '../../store/useAuth';
import { Button } from '../ui/button';

export function DashboardLayout() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });
  const { user, logout } = useAuth();
  const location = useLocation();
  const isDark = theme === 'dark';

  const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:8000/${path}`;
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
  }, [isDark, theme]);

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
      <aside className="w-64 bg-card border-r border-border flex flex-col shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <ShieldAlert className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-foreground">Admin Portal</h1>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Property Manager</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-secondary text-secondary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className={`p-1 rounded-md transition-colors ${active ? 'bg-background' : 'group-hover:bg-background'}`}>
                  <Icon size={16} />
                </div>
                <span className="flex-1">{item.name}</span>
                {active && <ChevronRight size={14} className="text-foreground opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          <div className="px-3 py-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center gap-3">
              {user?.image ? (
                <img src={getImageUrl(user.image)} alt={user.name} className="h-8 w-8 rounded-full object-cover shadow-sm" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-8 border-b border-border bg-card shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">
              {navItems.find((n) => n.path === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="h-8 w-8 rounded-md"
            >
              <Moon 
                size={14} 
                className={`transition-all duration-300 absolute ${
                  isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
                }`}
              />
              <Sun 
                size={14} 
                className={`transition-all duration-300 ${
                  isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
                }`}
              />
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
