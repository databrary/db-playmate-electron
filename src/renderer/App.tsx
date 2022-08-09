import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Databrary from './components/Databrary';

export default function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Container className="my-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/databrary" element={<Databrary />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}
