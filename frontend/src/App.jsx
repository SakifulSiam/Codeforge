import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header.jsx';
import Studio from './Studio.jsx';
import Sorting from './pages/Sorting.jsx';
import Pathfinding from './pages/Pathfinding.jsx';
import './visualizations.css';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Studio />} />
        <Route path="/sorting" element={<Sorting />} />
        <Route path="/pathfinding" element={<Pathfinding />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
