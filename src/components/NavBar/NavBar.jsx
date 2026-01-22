import { useContext } from 'react';
import { Link } from 'react-router';
import { UserContext } from '../../contexts/UserContext';

import styles from './NavBar.module.css';


const NavBar = () => {
  const { user, setUser } = useContext(UserContext);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <nav className={styles.container}>
      <Link to='/'>Landing</Link>
      {user ? (
        <ul>
          <li><Link to='/my-profile'>My Profile</Link></li>
          <li><Link to='/' onClick={handleSignOut}>Sign Out</Link></li>
        </ul>
      ) : (
        <ul>
          <li><Link to='/sign-up'>Sign up</Link></li>
          <li><Link to='/sign-in'>Sign in</Link></li>
        </ul>
      )}
    </nav>
  );
};

export default NavBar;