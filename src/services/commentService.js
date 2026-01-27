const BASE_URL = `${import.meta.env.VITE_BACK_END_SERVER_URL}/lists`;

const createComment = async (listId, commentFormData) => {
  try {
    const res = await fetch(`${BASE_URL}/${listId}/comments`, {
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

const updateComment = async (listId, commentId, text)=> {
  try {
    const res = await fetch(`${BASE_URL}/${listId}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({text}),
    });
    return res.json();
  } catch (error) {
    console.log(error);
  }
}

const deleteComment = async (listId, commentId) => {
  try {
    const res = await fetch(`${BASE_URL}/${listId}/comments/${commentId}`, {
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

export {
    createComment,
    updateComment,
    deleteComment,
}