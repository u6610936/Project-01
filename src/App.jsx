import { Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import SalesJournal from "./pages/SalesJournal";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <header className="navbar">
        <div className="nav-inner">
          <div className="brand">
            <span className="brand-badge" aria-hidden="true" />
            Sales App
          </div>

          <nav className="nav-links">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/journal"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              Sales Journal
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/journal" element={<SalesJournal />} />
        </Routes>
      </main>
    </div>
  );
}