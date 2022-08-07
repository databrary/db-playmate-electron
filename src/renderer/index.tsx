import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'react-circular-progressbar/dist/styles.css';
import App from './App';

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);
