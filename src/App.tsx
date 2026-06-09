import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Leagues from './pages/Leagues';
import Teams from './pages/Teams';
import Players from './pages/Players';
import WorldCup from './pages/WorldCup';

function AppContent() {
  const { darkMode } = useApp();
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <Header />
      <Navigation />
      <main className="fade-in">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/leagues" element={<Leagues />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/players" element={<Players />} />
          <Route path="/worldcup" element={<WorldCup />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}
