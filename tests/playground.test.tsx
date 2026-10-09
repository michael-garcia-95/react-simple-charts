import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../playground/App';

describe('foundation playground', () => {
  it('provides an accessible page and identifies its implementation status', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'React Simple Charts' }),
    ).toBeVisible();
    expect(
      screen.getByRole('region', { name: 'Repository foundation' }),
    ).toHaveTextContent('Chart components have not been implemented yet.');
  });
  it('does not present placeholder graphics as implemented charts', () => {
    const { container } = render(<App />);
    expect(container.querySelector('svg, canvas')).toBeNull();
    expect(screen.getByText(/Planned chart families:/)).toHaveTextContent(
      'Line, Bar, Area, Pie, and Donut',
    );
  });
});
