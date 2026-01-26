import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext.jsx';
import { ListsProvider } from './contexts/ListsContext.jsx';

import App from './App.jsx';

import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <ListsProvider>
          <App />
        </ListsProvider>
      </UserProvider>
    </BrowserRouter>
  </StrictMode>,
);
