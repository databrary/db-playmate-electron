import { Container, Nav, Navbar } from 'react-bootstrap';
import { withRouter } from 'renderer/withRouter';
import icon from '../../../assets/PLAY-logo.png';

const Navigation = ({ navigate }) => {
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
          <Nav.Link onClick={() => navigate('/')}>Dashboard</Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default withRouter(Navigation);
