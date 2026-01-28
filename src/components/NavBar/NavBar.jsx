import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import styles from './NavBar.module.css';

import logo from '../../assets/images/logo.png';

const NavBar = () => {
  const { user, setUser } = useContext(UserContext);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <nav className={styles.container}>
      {/* Left edge */}
      <div className={styles.left}>
        <Link className={styles.edgeLink} to="/">
          Home
        </Link>
      </div>

      {/* Center brand */}
      <div className={styles.center}>
        <div className={styles.brandLink} aria-label="TrailCast">
          <span className={styles.brandTrail}>Trail</span>
          <img src={logo} alt="TrailCast logo" className={styles.logo} />
          <span className={styles.brandCast}>Cast</span>
        </div>
      </div>

      {/* Right edge */}
      <div className={styles.right}>
        {user ? (
          <ul className={styles.menu}>
            <li>
              <Link to="/my-profile">My Profile</Link>
            </li>
            <li>
              <Link to="/" onClick={handleSignOut}>
                Sign Out
              </Link>
            </li>
          </ul>
        ) : (
          <ul className={styles.menu}>
            <li>
              <Link to="/sign-up">Sign up</Link>
            </li>
            <li>
              <Link to="/sign-in">Sign in</Link>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
