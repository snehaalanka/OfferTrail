import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Companies from './pages/Companies';
import CompanyWorkspace from './pages/CompanyWorkspace';
import Workspace from './pages/Workspace';
import Insights from './pages/Insights';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

import { Toaster } from 'react-hot-toast';
import { ConfirmProvider } from './context/ConfirmContext';

function App() {
  return (
    <ConfirmProvider>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#37352f',
            border: '1px solid #e9e9e6',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#415b33',
              secondary: '#fff',
            },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="home" element={<Home />} />
            <Route path="profile" element={<Profile />} />
            <Route path="companies" element={<Companies />} />
            <Route path="companies/:id" element={<CompanyWorkspace />} />
            <Route path="workspace" element={<Workspace />} />
            <Route path="insights" element={<Insights />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfirmProvider>
  );
}

export default App;