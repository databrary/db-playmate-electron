import { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import { NavigateFunction } from 'react-router-dom';
import { withRouter } from '../withRouter';

type Props = {
  navigate: NavigateFunction;
};

function Databrary({ navigate }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  const onDatabraryLogin = (e) => {
    e.preventDefault();
    setIsFetching(true);
    // eslint-disable-next-line promise/catch-or-return
    window.electron.ipcRenderer
      .invoke('databraryLogin', [{ email, password }])
      .then((_) => {
        navigate('/');
      })
      .catch((error) => {
        setIsError(true);
        setErrorMessage(error.message);
      })
      .finally(() => setIsFetching(false));
  };

  // if (isFetching) return <Spinner animation="border" />;

  return (
    <Box
      sx={{
        maxWidth: '100%',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <h1>Databrary Credentials</h1>
      </Box>

      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isFetching}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <TextField
        sx={{ my: 2 }}
        required
        fullWidth
        label="email"
        id="email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        sx={{ my: 2 }}
        required
        fullWidth
        type="password"
        label="password"
        id="password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button sx={{ my: 2 }} variant="outlined" onClick={onDatabraryLogin}>
        Login
      </Button>
      {isError && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </Box>
  );
}

export default withRouter(Databrary);
