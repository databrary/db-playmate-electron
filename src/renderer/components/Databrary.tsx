import { useState } from 'react';
import { Form, Button } from 'react-bootstrap';

function Databrary() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isError, setIsError] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const onDatabraryLogin = (e) => {
    e.preventDefault();
    setIsFetching(true);
    // eslint-disable-next-line promise/catch-or-return
    window.electron.ipcRenderer
      .invoke('databraryLogin', [{ email, password }])
      .catch((_) => setIsError(true))
      .finally(() => setIsFetching(false));
  };

  return (
    <Form onSubmit={onDatabraryLogin}>
      <h1 className="text-center mb-4">Databrary Credentials</h1>
      <Form.Group className="mb-3" controlId="formGroupEmail">
        <Form.Label>Email address</Form.Label>
        <Form.Control
          type="email"
          placeholder="Enter email"
          onChange={(e) => setEmail(e.target.value)}
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="formGroupPassword">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
      </Form.Group>
      <Button variant="primary" type="submit">
        Login
      </Button>
    </Form>
  );
}

export default Databrary;
