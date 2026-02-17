import { useEffect, useState } from 'react';
import ExitDashboard from './exit-dashboard.jsx';
import './App.css';

const WRITING = [
  { title: 'Medium: Product & Investing Notes', url: 'https://medium.com/@your-handle', source: 'Medium' },
  { title: 'Essay: Long-term Value Creation', url: 'https://example.com/essay', source: 'Personal Site' },
  { title: 'Operator Memo: Category Design', url: 'https://example.com/memo', source: 'Substack' },
  { title: 'Market Write-up: AI x Vertical SaaS', url: 'https://example.com/market', source: 'Guest Post' },
];

const PHOTOS = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
];

function HomePage({ onOpenDashboard }) {
  return (
    <div className="site">
      <header className="hero">
        <div className="hero__copy">
          <p className="eyebrow">OMAR SMITH</p>
          <h1>I invest in vertical software and AI, focused on how technology changes the way we work.</h1>
          <p className="lede">
            I write about venture, company strategy, and workflow transformation across industries. This site is a
            home for my writing, projects, and selected work.
          </p>
          <div className="hero__actions">
            <a className="btn btn--solid" href="https://www.linkedin.com/in/smithomar/" target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <button className="btn btn--ghost" onClick={onOpenDashboard}>
              Open Exits Dashboard
            </button>
          </div>
        </div>
        <div className="hero__card">
          <h2>Quick Bio</h2>
          <p>
            I invest in vertical software and AI companies and spend most of my time with founders building products
            that reshape core workflows across the economy.
          </p>
          <p>
            I am especially interested in how technology changes the way people and teams work in sectors that have
            historically been underserved by software.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="section__head">
          <h2>Writing</h2>
          <a href="https://medium.com/@your-handle" target="_blank" rel="noreferrer">
            View all
          </a>
        </div>
        <div className="writing">
          {WRITING.map((item) => (
            <a key={item.title} className="writing__item" href={item.url} target="_blank" rel="noreferrer">
              <span>{item.title}</span>
              <small>{item.source}</small>
            </a>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Photos</h2>
        </div>
        <div className="photos">
          {PHOTOS.map((src, idx) => (
            <img key={idx} src={src} alt={`Gallery ${idx + 1}`} loading="lazy" />
          ))}
        </div>
      </section>

      <footer className="footer">
        <p>Contact: omar@blackhornvc.com</p>
      </footer>
    </div>
  );
}

export default function App() {
  // Publish mode: only expose the exits dashboard.
  const DASHBOARD_ONLY = true;
  if (DASHBOARD_ONLY) return <ExitDashboard />;

  const viewFromHash = () => (window.location.hash.toLowerCase() === '#dashboard' ? 'dashboard' : 'home');
  const [view, setView] = useState(viewFromHash);

  useEffect(() => {
    const onHashChange = () => setView(viewFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const openDashboard = () => {
    window.location.hash = 'dashboard';
    setView('dashboard');
  };

  const openHome = () => {
    window.location.hash = '';
    setView('home');
  };

  if (view === 'dashboard') {
    return (
      <div>
        <div className="dash-topbar">
          <button className="btn btn--ghost" onClick={openHome}>
            Back to Home
          </button>
        </div>
        <ExitDashboard />
      </div>
    );
  }

  return <HomePage onOpenDashboard={openDashboard} />;
}
