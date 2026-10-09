import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../playground/App';

describe('rendering proof playground', () => {
  it('provides an accessible page and identifies its implementation status', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'React Simple Charts' }),
    ).toBeVisible();
    expect(
      screen.getByRole('region', {
        name: 'Public LineChart and internal rendering fixtures',
      }),
    ).toHaveTextContent('LineChart is publicly importable.');
  });
  it('demonstrates an internal SVG and responsive fallback with data alternatives', () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll('svg')).toHaveLength(8);
    expect(
      screen.getByRole('img', { name: 'Explicit quarterly sample' }),
    ).toBeVisible();
    expect(
      screen.getByRole('img', { name: /Responsive quarterly sample/ }),
    ).toBeVisible();
    expect(screen.getAllByRole('table')).toHaveLength(13);
    expect(screen.getByText(/Planned chart families:/)).toHaveTextContent(
      'Line, Bar, Area, Pie, and Donut',
    );
  });
});
