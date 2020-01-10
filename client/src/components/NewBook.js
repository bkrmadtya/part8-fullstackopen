import React, { useState } from 'react';
import { useSubscription, useMutation, useApolloClient } from 'react-apollo';
import { gql } from 'apollo-boost';

import { ALL_AUTHORS } from './Authors';
import { ALL_BOOKS } from './Books';

const BOOK_DETAILS = gql`
  fragment BookDetails on Book {
    title
    published
    author {
      name
    }
    genres
  }
`;

const BOOK_ADDED = gql`
  subscription {
    bookAdded {
      ...BookDetails
    }
  }
  ${BOOK_DETAILS}
`;

const ADD_BOOK = gql`
  mutation addBook(
    $title: String!
    $author: String!
    $published: Int!
    $genres: [String!]!
  ) {
    addBook(
      title: $title
      author: $author
      published: $published
      genres: $genres
    ) {
      title
    }
  }
`;

const NewBook = props => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [published, setPublished] = useState('');
  const [genre, setGenre] = useState('');
  const [genres, setGenres] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleError = error => {
    setErrorMessage(error.message);

    setTimeout(() => {
      setErrorMessage(null);
    }, 2000);
  };

  const notify = message => {
    setErrorMessage(message);

    setTimeout(() => {
      setErrorMessage(null);
    }, 2000);
  };

  const client = useApolloClient();

  const updateCacheWith = bookAdded => {
    const includedIn = (set, object) => set.map(p => p.id).includes(object.id);

    const dataInStore = client.readQuery({ query: ALL_BOOKS });
    if (!includedIn(dataInStore.allBooks, bookAdded)) {
      dataInStore.allBooks.push(bookAdded);
      client.writeQuery({
        query: ALL_BOOKS,
        data: dataInStore
      });
    }
  };

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      const bookAdded = subscriptionData.data.bookAdded;
      console.log(subscriptionData);
      notify(`New book ${bookAdded.title} by ${bookAdded.author.name} added!`);
      updateCacheWith(bookAdded);
    }
  });

  const [addBook] = useMutation(ADD_BOOK, {
    onError: handleError,
    refetchQueries: [{ query: ALL_AUTHORS }, { query: ALL_BOOKS }]
  });

  if (!props.show) {
    return null;
  }

  const submit = async e => {
    e.preventDefault();

    await addBook({
      variables: { title, author, published: parseInt(published), genres }
    });

    setTitle('');
    setPublished('');
    setAuthor('');
    setGenres([]);
    setGenre('');
  };

  const addGenre = () => {
    setGenres(genres.concat(genre));
    setGenre('');
  };

  return (
    <div>
      {errorMessage && <div>{errorMessage}</div>}
      <form onSubmit={submit}>
        <div>
          title
          <input
            value={title}
            onChange={({ target }) => setTitle(target.value)}
          />
        </div>
        <div>
          author
          <input
            value={author}
            onChange={({ target }) => setAuthor(target.value)}
          />
        </div>
        <div>
          published
          <input
            type="number"
            value={published}
            onChange={({ target }) => setPublished(target.value)}
          />
        </div>
        <div>
          <input
            value={genre}
            onChange={({ target }) => setGenre(target.value)}
          />
          <button onClick={addGenre} type="button">
            add genre
          </button>
        </div>
        <div>genres: {genres.join(' ')}</div>
        <button type="submit">create book</button>
      </form>
    </div>
  );
};

export default NewBook;
