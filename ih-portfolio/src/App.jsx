
import { useState } from 'react';
import { Route, Routes } from 'react-router';

import Navbar from './components/layout/Navbar';
import CustomCursor from './components/layout/CustomCursor';
import DitherBackground from './components/background/DitherBackground';
import PageTransitions from './components/layout/PageTransitions';

import Home from './pages/Home';
import Projects from './pages/Projects';
import Experience from './pages/Experience';
import Contact from './pages/Contact';

function App() {
  const [ditherAccent, setDitherAccent] = useState(null);

  return (
    <div className="app-shell">
      <DitherBackground accent={ditherAccent} />

      <Navbar />

      <CustomCursor />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route
          path="/experience"
          element={
            <Experience setDitherAccent={setDitherAccent} />
          }
        />
        <Route path="/contact" element={<Contact />} />
      </Routes>

      <PageTransitions />
    </div>
  );
}

export default App;
