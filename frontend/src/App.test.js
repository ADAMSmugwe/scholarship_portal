import { render, screen } from './test-utils';
import App from './App';

test('renders scholarship portal header', () => {
  render(<App />);
  const headerElement = screen.getByText(/scholarship portal/i);
  expect(headerElement).toBeInTheDocument();
});
