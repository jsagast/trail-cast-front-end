import { useEffect, useState, useContext } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ListsContext } from '../../contexts/ListsContext.jsx';
import Forecast from '../Forecast/Forecast.jsx';
import CommentForm from '../CommentForm/CommentForm.jsx';
import * as listService from '../../services/listService.js';
import * as forecastService from '../../services/forecastService.js';
import * as commentService from '../../services/commentService.js';

import { UserContext } from '../../contexts/UserContext';
import styles from './ShowList.module.css';

const coordKey = (lon, lat) => {
  const lo = Math.round(Number(lon) * 10000) / 10000;
  const la = Math.round(Number(lat) * 10000) / 10000;
  return `${lo}|${la}`;
};

const ShowList = () => {
  const { user } = useContext(UserContext);
  const { listId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [list, setList] = useState(state?.list ?? null);
  const [locations, setLocations] = useState(state?.locations ?? []);
  const [loading, setLoading] = useState(!(state?.locations?.length > 0));
  const [error, setError] = useState('');

  const [comments, setComments] = useState(state?.list?.comments ?? []);
  const [editingComment, setEditingComment] = useState(null);
  const [listActionError, setListActionError] = useState('');

  const ownerId = typeof list?.owner === 'object' ? list?.owner?._id : list?.owner;
  const creatorUsername =
    typeof list?.owner === 'object'
      ? list?.owner?.username
      : list?.owner === user?._id
        ? user?.username
        : null;

  const isOwner = Boolean(user?._id && ownerId && ownerId === user._id);

  useEffect(() => {
    if (!listId) {
      setError('Missing listId in URL.');
      setLoading(false);
      return;
    }

    if (state?.list && state?.locations?.length) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError('');

        const fetched = await listService.getList(listId);
        setList(fetched);

        setComments(
          fetched.comments?.map((comment) => ({
            _id: comment._id,
            text: comment.text,
            createdAt: comment.createdAt || new Date().toISOString(),
            owner: {
              _id: comment.owner?._id,
              username: comment.owner?.username || 'Unknown',
            },
          })) || []
        );

        const locDocs = (fetched.locations || [])
          .map((entry) => entry.location)
          .filter(Boolean);

        if (!locDocs.length) {
          setLocations([]);
          setError('This list has no locations yet.');
          return;
        }

        const batchInput = locDocs.map((loc) => ({
          name: loc.name,
          latitude: loc.latitude,
          longitude: loc.longitude,
        }));

        const batch = await forecastService.getWeatherBatch(batchInput);
        const results = batch?.results ?? batch ?? [];

        const byKey = new Map(
          results
            .filter((r) => Array.isArray(r.forecast) && r.forecast.length)
            .map((r) => [coordKey(r.lon ?? r.longitude, r.lat ?? r.latitude), r])
        );

        const built = [];
        for (const loc of locDocs) {
          const k = coordKey(loc.longitude, loc.latitude);
          const r = byKey.get(k);
          if (!r?.forecast?.length) continue;

          built.push({
            name: loc.name,
            lon: loc.longitude,
            lat: loc.latitude,
            forecast: r.forecast,
            source: 'init',
          });
        }

        if (!built.length) {
          setLocations([]);
          setError('Could not load forecasts for this list right now.');
          return;
        }

        setLocations(built);
      } catch (err) {
        setError(err?.message || 'Failed to load list.');
      } finally {
        setLoading(false);
      }
    })();
  }, [listId, state]);

  const handleAddComment = async (commentFormData) => {
    try {
      const newComment = await commentService.createComment(listId, commentFormData);
      const safeComment = {
        _id: newComment._id || Date.now(),
        text: newComment.text || commentFormData.text,
        createdAt: newComment.createdAt || new Date().toISOString(),
        owner: {
          _id: newComment.owner?._id || user?._id,
          username: newComment.owner?.username || 'You',
        },
      };
      setComments((prev) => [...prev, safeComment]);
    } catch (err) {
      console.error('Failed to add comment:', err);
      alert('Failed to add comment. Please try again.');
    }
  };

  const { deleteList } = useContext(ListsContext);

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    await commentService.deleteComment(listId, commentId);
    setComments((prev) => prev.filter((comment) => comment._id !== commentId));
    if (editingComment?._id === commentId) setEditingComment(null);
  };

  const handleUpdateComment = async (updatedCommentForm) => {
    const { _id, text } = updatedCommentForm;
    const updated = await commentService.updateComment(listId, _id, text);

    const prev = comments.find((c) => c._id === _id);
    const safeUpdated = {
      _id: updated?._id || _id,
      text: updated?.text ?? text,
      createdAt: updated?.createdAt || prev?.createdAt || new Date().toISOString(),
      owner: {
        _id: updated?.owner?._id || updated?.owner || prev?.owner?._id || user?._id,
        username: updated?.owner?.username || prev?.owner?.username || 'You',
      },
    };

    setComments((prevList) => prevList.map((c) => (c._id === _id ? safeUpdated : c)));
    return safeUpdated;
  };

  const handleDeleteList = async () => {
    setListActionError('');
    const ok = window.confirm(`Delete "${list?.name || 'this list'}"? This cannot be undone.`);
    if (!ok) return;

    try {
      await deleteList(listId);
      navigate('/my-profile', { replace: true });
    } catch (err) {
      setListActionError(err?.message || 'Failed to delete list.');
    }
  };

  if (loading) return <main className={styles.state}>Loading list…</main>;
  if (error) return <main className={styles.state}>{error}</main>;

  return (
    <main className={styles.container}>
      <section className={styles.gridArea}>
        <Forecast locations={locations} reorderable={false} limit={20} />
      </section>

      <aside className={styles.sidebar}>
        <div className={styles.sidebarItem}>
          <section className={styles.metaCard}>
            <div className={styles.metaHeader}>
              <h2 className={styles.metaTitle}>{list?.name ?? 'List'}</h2>

              {isOwner ? (
                <div className={styles.listActions}>
                  <Link className={`${styles.actionBtn} ${styles.editBtn}`} to={`/lists/${listId}/edit`}>
                    Edit
                  </Link>
                  <button
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    type="button"
                    onClick={handleDeleteList}
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>

            {list?.description ? (
              <p className={styles.metaDescription}>{list.description}</p>
            ) : (
              <p className={styles.metaDescriptionMuted}>No description added yet.</p>
            )}

            <p className={styles.metaByline}>by {creatorUsername || 'Unknown'}</p>
            {listActionError ? <p className={styles.error}>{listActionError}</p> : null}
          </section>
        </div>

        <div className={styles.sidebarItem}>
          <section className={styles.commentsCard}>
            <header className={styles.commentsHeader}>
              <h3 className={styles.commentsTitle}>Comments</h3>
            </header>

            <CommentForm
              listId={listId}
              handleAddComment={handleAddComment}
              editingComment={editingComment}
              setEditingComment={setEditingComment}
              handleUpdateComment={handleUpdateComment}
            />

            {comments.length === 0 ? (
              <p className={styles.emptyState}>There are no comments yet.</p>
            ) : (
              <div className={styles.commentList}>
                {comments.map((comment) => {
                  const isYou = Boolean(user?._id && comment.owner?._id === user._id);
                  const who = isYou ? 'You' : comment.owner?.username || 'Unknown';
                  const when = new Date(comment.createdAt).toLocaleDateString();

                  return (
                    <article key={comment._id} className={styles.comment}>
                      <p className={styles.commentMeta}>{`${who} posted on ${when}`}</p>
                      <p className={styles.commentText}>{comment.text}</p>

                      {isYou && (
                        <div className={styles.commentActions}>
                          <button
                            className={`${styles.actionBtn} ${styles.editBtn}`}
                            type="button"
                            onClick={() => setEditingComment(comment)}
                          >
                            Edit
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            type="button"
                            onClick={() => handleDeleteComment(comment._id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </aside>
    </main>
  );
};

export default ShowList;
