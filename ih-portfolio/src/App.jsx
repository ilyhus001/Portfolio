
import { useState } from 'react';
import { Route, Routes } from 'react-router';

import Navbar from './components/layout/Navbar';
import CustomCursor from './components/layout/CustomCursor';
import DitherBackground from './components/background/DitherBackground';
import PageTransitions from './components/layout/PageTransitions';
import ProjectLayout from './components/layout/ProjectLayout';

import Home from './pages/Home';
import Projects from './pages/Projects';
import CUArrival from './pages/projects/CUArrival';
import Experience from './pages/Experience';
import Contact from './pages/Contact';

import './styles/ios-fullscreen.css';

function App() {
  const [ditherAccent, setDitherAccent] = useState(null);

  return (
    <div className="app-shell">
      <DitherBackground accent={ditherAccent} />

      <Navbar />
      <CustomCursor />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/projects"
          element={
            <Projects setDitherAccent={setDitherAccent} />
          }
        />

        {/* All individual project pages share this layout. */}
        <Route path="/projects" element={<ProjectLayout />}>
          <Route
            path="cu-arrival"
            element={<CUArrival />}
          />
        </Route>

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
