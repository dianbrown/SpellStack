import React from 'react';
import { Routes, Route } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

// Pages
import HomePage from './pages/HomePage';
import SoloGamePage from './pages/SoloGamePage';
import RoomPage from './pages/RoomPage';

// Providers
import { SoundProvider } from './contexts/SoundContext';
import { SupabaseProvider } from './contexts/SupabaseContext';

function App() {
  return (
    <SupabaseProvider>
      <SoundProvider>
        <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/solo" element={<SoloGamePage />} />
            <Route path="/r/:roomCode" element={<RoomPage />} />
          </Routes>
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </SoundProvider>
    </SupabaseProvider>
  );
}

export default App;
