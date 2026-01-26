// src/components/Profile/Profile.jsx
import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListsContext } from '../../contexts/ListsContext.jsx';
import styles from './Profile.module.css';

const Profile = () => {
  const { lists, listsLoading, listsError, deleteList } = useContext(ListsContext);
  const [actionError, setActionError] = useState('');

  const handleDelete = async (list) => {
    setActionError('');
    const ok = window.confirm(`Delete "${list.name}"? This cannot be undone.`);
    if (!ok) return;

    try {
      await deleteList(list._id);
    } catch (err) {
      setActionError(err?.message || 'Failed to delete list.');
    }
  };

  if (listsLoading) return <main className={styles.container}>Loading…</main>;
  if (listsError) return <main className={styles.container}>{listsError}</main>;

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

        {actionError ? <p className={styles.error}>{actionError}</p> : null}

        {!lists.length ? (
          <p>You haven’t saved any lists yet.</p>
        ) : (
          <ul className={styles.list}>
            {lists.map((l) => (
              <li key={l._id} className={styles.listItem}>
                <Link to={`/lists/${l._id}`} className={styles.listLink}>
                  <div className={styles.listTitle}>{l.name}</div>
                  {l.description ? <div className={styles.listDesc}>{l.description}</div> : null}
                </Link>

                <div className={styles.actions}>
                  <Link className={styles.editBtn} to={`/lists/${l._id}/edit`}>
                    Edit
                  </Link>
                  <button className={styles.deleteBtn} type="button" onClick={() => handleDelete(l)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};

export default Profile;
