import { BarChart3, Code2, GitBranch } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <header className="topbar app-topbar">
      <Link className="brand-name brand-link" to="/" aria-label="CODEFORGE home">
        <span className="brand-code">CODE</span><span className="brand-forge">FORGE</span>
        <span className="brand-divider" /><span className="brand-context">Algorithm Studio</span>
      </Link>
      <nav className="main-nav" aria-label="Main navigation">
        <NavLink to="/" end><Code2 size={16} /> Studio</NavLink>
        <NavLink to="/sorting"><BarChart3 size={16} /> Sorting</NavLink>
        <NavLink to="/pathfinding"><GitBranch size={16} /> BFS Path</NavLink>
      </nav>
    </header>
  );
}
