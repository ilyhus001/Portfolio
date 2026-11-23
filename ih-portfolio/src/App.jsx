
import { useState } from 'react';

import {
  Route,
  Routes,
} from 'react-router';

import Navbar from './components/layout/Navbar';

import CustomCursor from './components/layout/CustomCursor';

import DitherBackground from './components/background/DitherBackground';

import PageTransitions from './components/layout/PageTransitions';

import Home from './pages/Home';
import Projects from './pages/Projects';
import Experience from './pages/Experience';
import Contact from './pages/Contact';

/* ========================================
   APP
   ======================================== */

function App() {
  const [ditherAccent, setDitherAccent] =
    useState(null);

  return (
    <div className="app-shell">

      {/* ONE GLOBAL DITHER BACKGROUND */}

      <DitherBackground accent={ditherAccent} />

      {/* NAVIGATION */}

      <Navbar />

      {/* GLOBAL CUSTOM CURSOR */}

      <CustomCursor />

      {/* PAGE ROUTES */}

      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/projects"
          element={<Projects />}
        />

        <Route
          path="/experience"
          element={
            <Experience
              setDitherAccent={setDitherAccent}
            />
          }
        />

        <Route
          path="/contact"
          element={<Contact />}
        />
      </Routes>

      {/* PAGE TRANSITIONS */}

      <PageTransitions />

    </div>
  );
}

export default App;
