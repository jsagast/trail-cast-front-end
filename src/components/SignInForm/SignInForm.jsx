import { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import { signIn } from '../../services/authService';
import { UserContext } from '../../contexts/UserContext';

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
    <main>
      <section>
        <form autoComplete='off' onSubmit={handleSubmit}>
          <h1>Sign In</h1>
          <p>{message}</p>
          <div>
            <label htmlFor='email'>Username or Email:</label>
            <input
              type='text'
              autoComplete='off'
              id='userId'
              value={userId}
              name='userId'
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor='password'>Password:</label>
            <input
              type='password'
              autoComplete='off'
              id='password'
              value={password}
              name='password'
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <button disabled={isFormInvalid()}>Sign In</button>
            <button onClick={() => navigate('/')}>Cancel</button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default SignInForm;