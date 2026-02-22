import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import { AccessProvider } from './contexts/AccessContext';
import { LigaProvider } from './contexts/LigaContext';
import Home from './pages/Home';
import TablaPosiciones from './pages/TablaPosiciones';
import Goleo from './pages/Goleo';
import Partidos from './pages/Partidos';
import AdminPanel from './pages/AdminPanel';
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
                <Route path="/goleo" element={<Goleo />} />
                <Route path="/partidos" element={<Partidos />} />
                <Route path="/admin" element={<AdminPanel />} />
              </Routes>
            </main>
            <footer className="footer">
              <p>SoccerGDL - {new Date().getFullYear()} | Plataforma multi-liga Futbol 7</p>
            </footer>
          </div>
        </Router>
      </LigaProvider>
    </AccessProvider>
  );
}

export default App;
