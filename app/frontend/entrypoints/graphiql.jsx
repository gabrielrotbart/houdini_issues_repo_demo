import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';
import React from 'react';
import { createRoot } from 'react-dom/client';
import ReactDOM from 'react-dom';

import 'graphiql/graphiql.css';

// wait until document is loaded
document.addEventListener('DOMContentLoaded', () => {
  const fetcher = createGraphiQLFetcher({
    url: 'http://localhost:3333/graphql',
    headers: {
      'X-CSRF-Token': document.querySelector(`meta[name="csrf-token"]`).content
    }
  });

  const root = createRoot(document.body)
  root.render(<GraphiQL fetcher={fetcher} fetchCSRF={fetcher.opt} />);
});