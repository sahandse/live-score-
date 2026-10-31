import { House, LayoutGrid, Users, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const ITEMS: { path: string; fa: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }[] = [
  { path: '/', fa: 'خانه', icon: House },
  { path: '/leagues', fa: 'لیگ‌ها', icon: LayoutGrid },
  { path: '/teams', fa: 'تیم‌ها', icon: Users },
  { path: '/players', fa: 'بازیکنان', icon: UserRound },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' || pathname.startsWith('/match') : pathname.startsWith(path);

  return (
    <nav className="dock" aria-label="ناوبری اصلی">
      {ITEMS.map(({ path, fa, icon: Icon }) => {
        const active = isActive(path);
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`dock-item ${active ? 'dock-on' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={active ? 2.3 : 1.7} />
            <span>{fa}</span>
          </button>
        );
      })}
    </nav>
  );
}
