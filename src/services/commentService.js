const BASE_PATH = '/locations';

const createComment = async (locationId, commentFormData) => {
  try {
    const res = await fetch(`${BASE_PATH}/${locationId}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentFormData),
    });
    return res.json();
  } catch (error) {
    console.log(error);
  }
};

const updateComment = async (locationId, commentId, commentFormData)=> {
  try {
    const res = await fetch(`${BASE_PATH}/${locationId}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentFormData),
    });
    return res.json();
  } catch (error) {
    console.log(error);
  }
}

const deleteComment = async (locationId, commentId) => {
  try {
    const res = await fetch(`${BASE_PATH}/${locationId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return res.json();
  } catch (error) {
    console.log(error);
  }
};

export default {
  createComment,
  updateComment,
  deleteComment,
};
