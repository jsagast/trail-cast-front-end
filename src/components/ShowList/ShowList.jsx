import { useEffect, useState, useContext } from 'react';
import { useLocation, useParams } from 'react-router-dom';
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

  const [list, setList] = useState(state?.list ?? null);
  const [locations, setLocations] = useState(state?.locations ?? []);
  const [loading, setLoading] = useState(!(state?.locations?.length > 0));
  const [error, setError] = useState('');

  const [comments, setComments] = useState(state?.list?.comments ?? []);
  const [editingComment, setEditingComment] = useState(null);

  useEffect(() => {
    if (!listId) {
      setError('Missing listId in URL.');
      setLoading(false);
      return;
    }

    // If navigated from CreateList and passed data, render immediately.
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

        // sets the comments when loading
        setComments(
          fetched.comments?.map(comment => ({
            _id: comment._id,
            text: comment.text,
            createdAt: comment.createdAt || new Date().toISOString(),
            owner: {
              _id: comment.owner?._id, 
              username: comment.owner?.username || 'Unknown',
            },
          })) || []
        );
        
        // Collect populated Location docs in list order
        const locDocs = (fetched.locations || [])
          .map((entry) => entry.location)
          .filter(Boolean);

        if (!locDocs.length) {
          setLocations([]);
          setError('This list has no locations yet.');
          return;
        }

        // Batch weather fetch (fast + resilient)
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

          // Skip entries that failed to fetch forecast (keeps Forecast from getting stuck)
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
  }, [listId]);

  const handleAddComment = async (commentFormData) => {
    try {
      const newComment = await commentService.createComment(listId, commentFormData);

      const safeComment = {
        _id: newComment._id || Date.now(),
        text: newComment.text || commentFormData.text,
        createdAt: newComment.createdAt || new Date().toISOString(),
        owner: {
          _id: newComment.owner?._id || user._id, // <- assign logged-in user
          username: newComment.owner?.username || "You",
        },
      };

      setComments(prev => [...prev, safeComment]);
    } catch (err) {
      console.error('Failed to add comment:', err);
      alert('Failed to add comment. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    await commentService.deleteComment(listId, commentId);
    setComments(comments => comments.filter(comment => comment._id !== commentId));

    if (editingComment?._id === commentId) {
      setEditingComment(null);
    }
  };

  const handleUpdateComment = async (updatedCommentForm) => {
    try {
      const { _id, text } = updatedCommentForm;

      const updatedComment = await commentService.updateComment(listId, _id, text);

      setComments(comments =>
        comments.map(comment =>
          comment._id === updatedComment._id
            ? { ...comment, text: updatedComment.text } 
            : comment
        )
      );


      return updatedComment;
    } catch (err) {
      console.error('Failed to update comment:', err);
      throw err;
    }
  };


  if (loading) return <main className={styles.container}>Loading list…</main>;
  if (error) return <main className={styles.container}>{error}</main>;

  return (
    <main className={styles.container}>
      <h2>{list?.name ?? 'List'}</h2>
      {list?.description && <p>{list.description}</p>}

      <Forecast
        locations={locations}
        reorderable={false}
        limit={20}
      />

      <section className={styles.comments}>
        <h3>Comments</h3>
        <CommentForm
          listId={listId}
          handleAddComment={handleAddComment}
          editingComment={editingComment}
          setEditingComment={setEditingComment}
          handleUpdateComment={handleUpdateComment}
        />

        {comments.length === 0 && <p>There are no comments yet.</p>}

        {comments.map(comment => (
          <article key={comment._id} className={styles.comment}>
            <header>
              <p>
                {`${comment.owner._id === user._id ? 'You' : comment.owner.username} posted on ${new Date(comment.createdAt).toLocaleDateString()}`}
              </p>
            </header>
            <p>{comment.text}</p>

            {user && comment.owner._id === user._id && (
              <div className={styles.commentActions}>
                <button onClick={() => setEditingComment(comment)}>Edit</button>
                <button onClick={() => handleDeleteComment(comment._id)}>Delete</button>
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
};

export default ShowList;
