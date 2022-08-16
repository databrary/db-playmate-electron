import { MemoryRouter as Router } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MainPage from './MainPage';

const App = () => {
  return (
    <Router initialEntries={['/', 'databrary']}>
      <MainPage />
    </Router>
  );
};

export default App;
