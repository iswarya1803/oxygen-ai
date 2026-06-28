import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Generator from './pages/Generator';
import History from './pages/History';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="container mt-8 mb-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/generate" element={<Generator />} />
            <Route path="/history" element={<History />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
