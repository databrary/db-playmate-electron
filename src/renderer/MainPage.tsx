import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';

import { Container } from 'react-bootstrap';

import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Databrary from './components/Databrary';
import { withRouter } from './withRouter';

const MainPage = ({ navigate }) => {
  useEffect(() => {
    if (!navigate) return;

    window.electron.ipcRenderer
      .invoke('isDatabraryConnected', [])
      .then((isConnected) => {
        if (isConnected) {
          navigate('/');
        } else {
          navigate('/databrary');
        }
        // eslint-disable-next-line no-useless-return
        return;
      })
      .catch((error) => {
        navigate('/');
      });
  }, [navigate]);

  return (
    <>
      <Navigation />
      <Container className="my-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/databrary" element={<Databrary />} />
        </Routes>
      </Container>
    </>
  );
};

export default withRouter(MainPage);
