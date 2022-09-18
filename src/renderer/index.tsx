import { createRoot } from 'react-dom/client';
import { MemoryRouter as Router } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { Provider } from 'react-redux';
import { store } from './store/store';

import App from './App';

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(
  <Provider store={store}>
    <Router initialEntries={['/', 'databrary']}>
      <SnackbarProvider
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <App />
      </SnackbarProvider>
    </Router>
  </Provider>
);
