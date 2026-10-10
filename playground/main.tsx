import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FiveCharts } from './FiveCharts';
import { App } from './App';
import './style.css';

const root = document.getElementById('root');
if (!root) throw new Error('Playground root element is missing.');
createRoot(root).render(
  <StrictMode>
    {new URLSearchParams(window.location.search).has('five-charts') ? (
      <main className="five-page">
        <h1>React Simple Charts integration</h1>
        <FiveCharts />
      </main>
    ) : (
      <App />
    )}
  </StrictMode>,
);
