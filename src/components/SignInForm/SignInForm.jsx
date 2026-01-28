import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../../services/authService';
import { UserContext } from '../../contexts/UserContext';

import styles from './SignInForm.module.css';

const SignInForm = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
  });

  const { userId, password } = formData;

  const handleChange = (evt) => {
    setMessage('');
    setFormData({ ...formData, [evt.target.name]: evt.target.value });
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    try {
      const signedInUser = await signIn(formData);
      setUser(signedInUser);
      navigate('/');
    } catch (err) {
      setMessage(err.message);
    }
  };

  const isFormInvalid = () => {
    return !(userId && password);
  };

  return (
    <main className={styles.container}>
      <section className={styles.card}>
        <form className={styles.form} autoComplete="off" onSubmit={handleSubmit}>
          <header className={styles.header}>
            <h1 className={styles.title}>Sign In</h1>
            {message ? <p className={styles.message}>{message}</p> : null}
          </header>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="userId">
              Username or Email:
            </label>
            <input
              className={styles.input}
              type="text"
              autoComplete="off"
              id="userId"
              value={userId}
              name="userId"
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password:
            </label>
            <input
              className={styles.input}
              type="password"
              autoComplete="off"
              id="password"
              value={password}
              name="password"
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.actions}>
            <button className={styles.primaryBtn} disabled={isFormInvalid()}>
              Sign In
            </button>
            <button
              className={styles.secondaryBtn}
              type="button"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default SignInForm;
