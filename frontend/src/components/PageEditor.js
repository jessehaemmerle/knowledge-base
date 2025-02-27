import React, { useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { createPage } from '../api';
import { useNavigate } from 'react-router-dom';

function PageEditor({ token }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const navigate = useNavigate();

  const handleEditorChange = (content) => {
    setContent(content);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPage({ title, content, tags: [] }, token);
      navigate('/');
    } catch (error) {
      alert('Fehler beim Erstellen der Seite');
    }
  };

  return (
    <div>
      <h2>Neue Seite erstellen</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Titel:</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label>Inhalt:</label>
          <Editor
            apiKey="dein_tinymce_api_key" 
            initialValue=""
            init={{
              height: 400,
              menubar: false,
              plugins: [
                'advlist autolink lists link image charmap print preview anchor',
                'searchreplace visualblocks code fullscreen',
                'insertdatetime media table paste code help wordcount'
              ],
              toolbar:
                'undo redo | formatselect | bold italic backcolor | \
                alignleft aligncenter alignright alignjustify | \
                bullist numlist outdent indent | removeformat | help'
            }}
            onEditorChange={handleEditorChange}
          />
        </div>
        <button type="submit">Speichern</button>
      </form>
    </div>
  );
}

export default PageEditor;
