import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AccessProvider } from './contexts/AccessContext';
import { LigaProvider } from './contexts/LigaContext';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Equipos from './pages/Equipos';
import Partidos from './pages/Partidos';
import TablaPosiciones from './pages/TablaPosiciones';
import './App.css';

function App() {
  return (
    <AccessProvider>
      <LigaProvider>
        <Router>
          <div className="App">
            <NavBar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tabla" element={<TablaPosiciones />} />
                <Route path="/equipos" element={<Equipos />} />
                <Route path="/partidos" element={<Partidos />} />
              </Routes>
            </main>
            <footer className="footer">
              <p>⚽ Liga Fut 7 - {new Date().getFullYear()} | 6 Ligas, 6 Días de Fútbol</p>
            </footer>
          </div>
        </Router>
      </LigaProvider>
    </AccessProvider>
  );
}

export default App;