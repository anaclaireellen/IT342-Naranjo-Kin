import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('react-router-dom', () => ({
  HashRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => {
    const React = require('react');
    const firstRoute = React.Children.toArray(children)[0];
    return <div>{firstRoute?.props?.element}</div>;
  },
  Route: ({ element }) => <>{element}</>,
  Navigate: ({ to }) => <div>Navigate to {to}</div>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ search: '', state: {} })
}), { virtual: true });

test('renders KIN landing page routes after vertical slice refactor', () => {
  render(<App />);
  expect(screen.getByText(/Borrowing and student support/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
});
