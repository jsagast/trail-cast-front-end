import { useState, useEffect } from 'react';

const ActivityForm = (props) => {
  const [formData, setFormData] = useState({ text: '', day: '' });

  /* ---------- populate form when editing ---------- */
  useEffect(() => {
    if (props.editingActivity) {
      setFormData({
        text: props.editingActivity.text,
        day: props.editingActivity.day
          ? new Date(props.editingActivity.day).toISOString().slice(0, 10)
          : '',
      });
    } else {
      setFormData({ text: '', day: '' });
    }
  }, [props.editingActivity]);

  /* ---------- handlers ---------- */
  const handleChange = (evt) => {
    setFormData({ ...formData, [evt.target.name]: evt.target.value });
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if (!formData.text.trim()) return;

    try {
      if (props.editingActivity) {
        await props.handleUpdateActivity({
          ...props.editingActivity,
          text: formData.text,
          day: new Date(formData.day),
        });

        props.setEditingActivity(null); // exit edit mode
      } else {
        await props.handleAddActivity({
          text: formData.text,
          day: new Date(formData.day),
        });

        setFormData({ text: '', day: '' });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save activity. Please try again.');
    }
  };

  const handleCancel = () => {
    props.setEditingActivity(null);
    setFormData({ text: '', day: '' });
  };

  /* ---------- render ---------- */
  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="day-input">Day:</label>
      <input
        required
        type="date"
        name="day"
        id="day-input"
        value={formData.day}
        onChange={handleChange}
      />

      <label htmlFor="text-input">Your Activity:</label>
      <textarea
        required
        name="text"
        id="text-input"
        value={formData.text}
        onChange={handleChange}
      />

      <div>
        <button type="submit">
          {props.editingActivity ? 'Update' : 'Add'}
        </button>

        {props.editingActivity && (
          <button type="button" onClick={handleCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ActivityForm;
