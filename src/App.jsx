import { useContext, useState } from 'react';
import { Routes, Route } from 'react-router';
import { UserContext } from './contexts/UserContext';

import NavBar from './components/NavBar/NavBar';
import Landing from './components/Landing/Landing.jsx';
import SignUpForm from './components/SignUpForm/SignUpForm.jsx';
import SignInForm from './components/SignInForm/SignInForm.jsx';
import Profile from './components/Profile/Profile.jsx';
import * as forecastService from './services/forecastService';

const App = () => {
  const { user } = useContext(UserContext);


  return (
    <>
      <NavBar/>
      <Routes>
        <Route path='/' element={<Landing />} />
        <Route path='/sign-up' element={<SignUpForm />} />
        <Route path='/sign-in' element={<SignInForm />} />
        <Route path='/my-profile' element={<Profile />} />
      </Routes>
    </>
  );
};

export default App;