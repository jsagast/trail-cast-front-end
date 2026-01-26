import { useContext, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { UserContext } from './contexts/UserContext';

import NavBar from './components/NavBar/NavBar';
import Landing from './components/Landing/Landing.jsx';
import SignUpForm from './components/SignUpForm/SignUpForm.jsx';
import SignInForm from './components/SignInForm/SignInForm.jsx';
import Profile from './components/Profile/Profile.jsx';
import ShowLocation from './components/ShowLocation/ShowLocation.jsx';
import ShowList from './components/ShowList/ShowList.jsx';
import CreateList from './components/CreateList/CreateList.jsx';

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
        <Route path='/location' element={<ShowLocation />} />

        <Route path='/lists/:listId' element={<ShowList />} />
        <Route path='/lists/new' element={<CreateList mode="create" />} />
        <Route path='/lists/:listId/edit' element={<CreateList mode="edit" />} />
      </Routes>
    </>
  );
};

export default App;