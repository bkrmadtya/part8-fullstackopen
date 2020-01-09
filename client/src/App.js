import React, { useState } from 'react';
import { useApolloClient } from 'react-apollo';

import Authors from './components/Authors';
import Books from './components/Books';
import NewBook from './components/NewBook';
import Recommended from './components/Recommended';
import LoginForm from './components/LoginForm';

const App = () => {
  const [page, setPage] = useState('books');
  const [token, setToken] = useState(null);

  const client = useApolloClient();

  const handleSetToken = token => {
    if (token) {
      setToken(token);
      setPage('authors');
    }
  };

  const logout = () => {
    setToken(null);
    setPage('authors');
    localStorage.clear();
    client.resetStore();
  };

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        {token ? (
          <>
            <button onClick={() => setPage('add')}>add book</button>
            <button onClick={() => setPage('recommended')}>recommended</button>
            <button onClick={logout}>logout</button>
          </>
        ) : (
          <button onClick={() => setPage('login')}>login</button>
        )}
      </div>

      <Authors show={page === 'authors'} />

      <Books show={page === 'books'} />

      <NewBook show={page === 'add'} />

      <Recommended show={page === 'recommended'} />

      <LoginForm handleSetToken={handleSetToken} show={page === 'login'} />
    </div>
  );
};

export default App;
