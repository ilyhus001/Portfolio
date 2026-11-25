
import { Outlet } from 'react-router';
import '../../styles/project-layout.css';

/**
 * Shared scrolling shell for every individual project page.
 * Add new case studies as nested routes in App.jsx.
 */
export default function ProjectLayout() {
  return (
    <div className="project-page-scroll" data-project-scroll>
      <Outlet />
    </div>
  );
}
