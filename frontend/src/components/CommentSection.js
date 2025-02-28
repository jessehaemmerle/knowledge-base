import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CommentSection({ pageId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [author, setAuthor] = useState('');

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/comments/page/${pageId}`);
      setComments(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Kommentare', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/comments`, {
        pageId,
        author,
        content: newComment
      });
      setNewComment('');
      fetchComments();
    } catch (error) {
      alert('Kommentar konnte nicht gespeichert werden');
    }
  };

  useEffect(() => {
    fetchComments();
  }, [pageId]);

  return (
    <div className="comment-section">
      <h3>Kommentare</h3>
      <ul>
        {comments.map(comment => (
          <li key={comment.id}>
            <strong>{comment.author}</strong> ({new Date(comment.timestamp).toLocaleString()}): 
            <p>{comment.content}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Dein Name" 
          value={author} 
          onChange={e => setAuthor(e.target.value)} 
          required 
        />
        <textarea 
          placeholder="Kommentar verfassen" 
          value={newComment} 
          onChange={e => setNewComment(e.target.value)} 
          required 
        />
        <button type="submit">Kommentar absenden</button>
      </form>
    </div>
  );
}

export default CommentSection;
