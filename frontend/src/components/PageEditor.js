import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPage } from '../api';
import './static/PageEditor.css';

function PageEditor({ token }) {
  const [title, setTitle] = useState('');
  const editorRef = useRef(null);
  const navigate = useNavigate();

  // Führt document.execCommand aus
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  // Funktion zum Einfügen eines Links
  const handleLink = () => {
    const url = prompt("Bitte URL eingeben:");
    if (url) {
      execCommand('createLink', url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const content = editorRef.current.innerHTML;
    if (title.trim() === '' || content.trim() === '') {
      alert("Titel und Inhalt dürfen nicht leer sein.");
      return;
    }
    try {
      await createPage({ title, content, tags: [] }, token);
      navigate('/');
    } catch (error) {
      alert("Fehler beim Speichern der Seite.");
    }
  };

  return (
    <div className="page-editor-container">
      <h2>Neue Seite erstellen</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="title">Titel:</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Seitentitel eingeben"
            required
          />
        </div>
        <div className="editor-toolbar">
          <button type="button" onClick={() => execCommand('bold')} title="Fett">
            <b>B</b>
          </button>
          <button type="button" onClick={() => execCommand('italic')} title="Kursiv">
            <i>I</i>
          </button>
          <button type="button" onClick={() => execCommand('underline')} title="Unterstrichen">
            <u>U</u>
          </button>
          <button type="button" onClick={() => execCommand('strikeThrough')} title="Durchgestrichen">
            <s>S</s>
          </button>
          <button type="button" onClick={() => execCommand('insertOrderedList')} title="Nummerierte Liste">
            OL
          </button>
          <button type="button" onClick={() => execCommand('insertUnorderedList')} title="Aufzählung">
            UL
          </button>
          <button type="button" onClick={() => execCommand('justifyLeft')} title="Linksbündig">
            ⇤
          </button>
          <button type="button" onClick={() => execCommand('justifyCenter')} title="Zentriert">
            ↔
          </button>
          <button type="button" onClick={() => execCommand('justifyRight')} title="Rechtsbündig">
            ⇥
          </button>
          <button type="button" onClick={handleLink} title="Link einfügen">
            Link
          </button>
        </div>
        <div
          className="editor-area"
          ref={editorRef}
          contentEditable
          placeholder="Schreibe deinen Inhalt hier..."
        ></div>
        <button type="submit" className="submit-btn">
          Speichern
        </button>
      </form>
    </div>
  );
}

export default PageEditor;
