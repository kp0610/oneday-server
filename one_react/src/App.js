import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
// Removed direct imports for DiaryCollection, StopwatchCollection, HealthcareCollection
import MainLayout from './MainLayout';
import Profile from './Profile';
import Diary from './Diary'; // Import Diary component
import DiaryView from './DiaryView'; // Import DiaryView component
import { useProfile } from './ProfileContext'; // Import useProfile
import Template from './Template'; // Import Template component
import CollectionView from './CollectionView'; // Import new CollectionView component

import { DataProvider } from './DataContext'; // Import DataProvider
import './App.css'; // Ensure App.css is imported

const BASE_WIDTH = 1194; // New base width
const BASE_HEIGHT = 834; // New base height

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scale, setScale] = useState(1); // Add scale state
  const [isTemplateNavOpen, setIsTemplateNavOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const userId = localStorage.getItem('userId');
      const authStatus = !!userId;
      setIsAuthenticated(authStatus);
      // console.log('App.js - Initial isAuthenticated status:', authStatus); // Debug log
    };

    checkAuth(); // Check on initial load
    window.addEventListener('storage', checkAuth); // Check on storage change
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  // Scaling logic
  useEffect(() => {
    const calculateScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const widthScale = viewportWidth / BASE_WIDTH;
      const heightScale = viewportHeight / BASE_HEIGHT;

      const newScale = Math.min(widthScale, heightScale);
      setScale(newScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);

    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const DiaryWrapper = () => {
    const { date } = useParams();
    const { profile } = useProfile();
    const getToday = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    const selectedDate = date || getToday();
    return <Diary selectedDate={selectedDate} userId={profile.userId} />;
  };

  const DiaryViewWrapper = () => {
    const { id } = useParams();
    return <DiaryView id={id} />;
  };

  return (
    <div id="scale-wrapper">
      <div
        id="ipad-root"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          // To center the scaled content horizontally
          marginLeft: scale < 1 ? `${(window.innerWidth - BASE_WIDTH * scale) / 2}px` : 'auto',
          marginRight: scale < 1 ? `${(window.innerWidth - BASE_WIDTH * scale) / 2}px` : 'auto',
        }}
      >
          <div id="content-frame">
            <Router>
              <div className="App">
                <Routes>
                  <Route path="/login" element={isAuthenticated ? <Navigate to="/home" /> : <Login onLogin={handleLogin} />} />
                  
                  <Route element={isAuthenticated ? <DataProvider><MainLayout setIsTemplateNavOpen={setIsTemplateNavOpen} isTemplateNavOpen={isTemplateNavOpen} /></DataProvider> : <Navigate to="/login" />} >
                    <Route path="/home" element={<Home />} />
                    {/* All collection routes now point to CollectionView */}
                    <Route path="/diary-collection" element={<CollectionView />} />
                    <Route path="/stopwatch-collection" element={<CollectionView />} />
                    <Route path="/healthcare-collection" element={<CollectionView />} />
                    <Route path="/diary" element={<DiaryWrapper />} />
                    <Route path="/diary/:date" element={<DiaryWrapper />} />
                    <Route path="/diary-view/id/:id" element={<DiaryViewWrapper />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/template" element={<Template />} />
                  </Route>

                  <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
              </div>
            </Router>
          </div>
      </div>
    </div>
  );
}

export default App;
