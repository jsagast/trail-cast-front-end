// src/components/Profile/Profile.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as listService from '../../services/listService.js';
import styles from './Profile.module.css';

const Profile = () => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await listService.getMyLists();
        setLists(data);
      } catch (err) {
        setError(err.message || 'Failed to load your lists.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <main className={styles.container}>Loading…</main>;
  if (error) return <main className={styles.container}>{error}</main>;

  return (
    <main className={styles.container}>
      <h2>My Profile</h2>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Saved Lists</h3>
          <Link className={styles.newBtn} to="/lists/new">
            + New list
          </Link>
        </div>

        {!lists.length ? (
          <p>You haven’t saved any lists yet.</p>
        ) : (
          <ul className={styles.list}>
            {lists.map((l) => (
              <li key={l._id} className={styles.listItem}>
                <Link to={`/lists/${l._id}`} className={styles.listLink}>
                  <div className={styles.listTitle}>{l.name}</div>
                  {l.description ? (
                    <div className={styles.listDesc}>{l.description}</div>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};

export default Profile;
