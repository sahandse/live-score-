import { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Leagues from './pages/Leagues';
import Teams from './pages/Teams';
import Players from './pages/Players';
import MatchDetail from './pages/MatchDetail';

const scrollMemory = new Map<string, number>();

function ScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    window.scrollTo(0, navigationType === 'POP' ? (scrollMemory.get(location.key) ?? 0) : 0);
    return () => {
      scrollMemory.set(location.key, window.scrollY);
    };
  }, [location.key, navigationType]);

  return null;
}

function AppContent() {
  return (
    <div className="app-shell">
      <Header />
      <main className="relative fade-in">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/leagues" element={<Leagues />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/players" element={<Players />} />
          <Route path="/match/:id" element={<MatchDetail />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <ScrollManager />
        <AppContent />
      </AppProvider>
    </HashRouter>
  );
}
