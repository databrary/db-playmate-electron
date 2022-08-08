import { Container, Nav, Navbar } from 'react-bootstrap';
import icon from '../../../assets/PLAY-logo.png';

const Navigation = () => {
  return (
    <Navbar bg="primary">
      <Container>
        <Navbar.Brand href="/">
          <img
            src={icon}
            width="30"
            height="30"
            className="d-inline-block align-top"
            alt="React Bootstrap logo"
          />
        </Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link href="/">Dashboard</Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default Navigation;
