import { useEffect } from 'react';

import { Routes, Route, NavigateFunction } from 'react-router-dom';
import { Container } from '@mui/material';
import Dashboard from './components/Dashboard';
import Databrary from './components/Databrary';
import { withRouter } from './withRouter';

type Props = {
  navigate: NavigateFunction;
};

const App = ({ navigate }: Props) => {
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
      })
      .catch((error) => {
        navigate('/');
      });
  }, [navigate]);

  return (
    <Container>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/databrary" element={<Databrary />} />
      </Routes>
    </Container>
  );
};

export default withRouter(App);
