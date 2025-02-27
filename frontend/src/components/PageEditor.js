import React, { useRef, useState } from 'react';
import { createPage } from '../api';
import { useNavigate } from 'react-router-dom';

function PageEditor({ token }) {
  const [title, setTitle] = useState('');
  const editorRef = useRef(null);
  const navigate = useNavigate();

  // Führt Befehle zur Formatierung aus
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  // Beim Absenden wird der Inhalt des Editors ausgelesen und an das Backend geschickt
  const handleSubmit = async (e) => {
    e.preventDefault();
    const pageContent = editorRef.current.innerHTML;
    try {
      await createPage({ title, content: pageContent, tags: [] }, token);
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
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          {/* Einfache Toolbar */}
          <div style={{ marginBottom: '10px' }}>
            <button type="button" onClick={() => execCommand('bold')}>
              Fett
            </button>
            <button type="button" onClick={() => execCommand('italic')}>
              Kursiv
            </button>
            <button type="button" onClick={() => execCommand('underline')}>
              Unterstrichen
            </button>
            <button type="button" onClick={() => execCommand('insertOrderedList')}>
              Nummerierte Liste
            </button>
            <button type="button" onClick={() => execCommand('insertUnorderedList')}>
              Aufzählung
            </button>
          </div>
          {/* Contenteditable-Editor */}
          <div
            ref={editorRef}
            contentEditable
            style={{
              border: '1px solid #ccc',
              minHeight: '200px',
              padding: '10px'
            }}
          ></div>
        </div>
        <button type="submit">Speichern</button>
      </form>
    </div>
  );
}

export default PageEditor;
