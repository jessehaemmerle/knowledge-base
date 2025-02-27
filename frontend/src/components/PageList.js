import React, { useEffect, useState } from 'react';
import { fetchPages } from '../api';

function PageList() {
  const [pages, setPages] = useState([]);

  useEffect(() => {
    fetchPages().then(data => setPages(data));
  }, []);

  return (
    <div>
      <h2>Übersicht der Seiten</h2>
      <ul>
        {pages.map(page => (
          <li key={page.id}>
            <h3>{page.title}</h3>
            <div dangerouslySetInnerHTML={{ __html: page.content }} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PageList;
