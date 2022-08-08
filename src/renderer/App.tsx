import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';

export default function App() {
  return (
    <Router>
      <Navigation />
      <Container className="my-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Container>
    </Router>
  );
}
