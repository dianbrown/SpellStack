import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import HomePage from './pages/HomePage';
import SoloGamePage from './pages/SoloGamePage';
import { MultiplayerPage } from './pages/MultiplayerPage';
import { RoomPage } from './pages/RoomPage';

// Providers
import { SoundProvider } from './contexts/SoundContext';

function App() {
  return (
    <SoundProvider>
        <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/solo" element={<SoloGamePage />} />
            <Route path="/multiplayer" element={<MultiplayerPage />} />
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
  );
}

export default App;
