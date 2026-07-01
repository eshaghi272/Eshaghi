import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App__.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import { ReferralProvider } from './auth/ReferralContext.jsx';
import { UserProvider } from './auth/UserContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ReferralProvider>
          <UserProvider>
            <App />
          </UserProvider>
        </ReferralProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
