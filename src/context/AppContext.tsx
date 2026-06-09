import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface Reminder {
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  league: string;
}

interface AppContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  reminders: Reminder[];
  addReminder: (reminder: Reminder) => void;
  removeReminder: (matchId: string) => void;
  hasReminder: (matchId: string) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('reminders');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders));
  }, [reminders]);

  const toggleDarkMode = () => setDarkMode((prev: boolean) => !prev);

  const toggleFavorite = (id: string) => {
    setFavorites((prev: string[]) =>
      prev.includes(id) ? prev.filter((f: string) => f !== id) : [...prev, id]
    );
  };

  const isFavorite = (id: string) => favorites.includes(id);

  const addReminder = (reminder: Reminder) => {
    setReminders((prev: Reminder[]) => [...prev.filter((r: Reminder) => r.matchId !== reminder.matchId), reminder]);
  };

  const removeReminder = (matchId: string) => {
    setReminders((prev: Reminder[]) => prev.filter((r: Reminder) => r.matchId !== matchId));
  };

  const hasReminder = (matchId: string) => reminders.some((r: Reminder) => r.matchId === matchId);

  return (
    <AppContext.Provider value={{ darkMode, toggleDarkMode, favorites, toggleFavorite, isFavorite, reminders, addReminder, removeReminder, hasReminder }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
