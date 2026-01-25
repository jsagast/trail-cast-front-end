
import { useState } from 'react';

const LogForm = (props) => {
    const [formData, setFormData] = useState({ text: '', day: '' });

    const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (evt) => {
    evt.preventDefault();
    props.handleAddComment({...formData,day: new Date(formData.day) }); 
    setFormData({ text: '', day: '' });
    };


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
        <label htmlFor='text-input'>Your Activity:</label>
        <textarea
            required
            type='text'
            name='text'
            id='text-input'
            value={formData.text}
            onChange={handleChange}
        />
        <button type='submit'>SUBMIT ACTIVITY</button>
    </form>
  );
};

export default LogForm;

