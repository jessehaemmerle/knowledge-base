import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CommentSection from './CommentSection';

function PageDetail({ match }) {
  const [page, setPage] = useState(null);
  const pageId = match.params.id; // oder über useParams() aus react-router-dom

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/pages/${pageId}`)
      .then(response => setPage(response.data))
      .catch(error => console.error(error));
  }, [pageId]);

  if (!page) return <div>Lade...</div>;

  return (
    <div>
      <h2>{page.title}</h2>
      <div dangerouslySetInnerHTML={{ __html: page.content }}></div>
      {/* Anzeige der Versionen */}
      {page.versions && page.versions.length > 0 && (
        <div>
          <h3>Versionen</h3>
          <ul>
            {page.versions.map((version, index) => (
              <li key={index}>
                <strong>{new Date(version.updatedAt).toLocaleString()}:</strong> {version.title}
              </li>
            ))}
          </ul>
        </div>
      )}
      <CommentSection pageId={pageId} />
    </div>
  );
}

export default PageDetail;
