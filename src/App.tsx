import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Leagues from './pages/Leagues';
import Teams from './pages/Teams';
import Players from './pages/Players';
import MatchDetail from './pages/MatchDetail';

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
        <AppContent />
      </AppProvider>
    </HashRouter>
  );
}
