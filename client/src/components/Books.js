import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-apollo';
import { gql } from 'apollo-boost';

export const ALL_BOOKS = gql`
  {
    allBooks {
      title
      published
      author {
        name
      }
      genres
    }
  }
`;

const Books = props => {
  const books = useQuery(ALL_BOOKS);
  const [genre, setGenre] = useState('');
  const [booksToShow, setBooksToShow] = useState([]);

  useEffect(() => {
    if (books.data && booksToShow.length === 0) {
      setBooksToShow(books.data.allBooks);
    }
  }, [books.data, booksToShow.length]);

  if (!props.show) {
    return null;
  }

  if (books.loading) {
    return <div>Loading...</div>;
  }

  const filterGenres = genre => {
    setGenre(genre);

    if (genre === 'all genres') {
      setBooksToShow(books.data.allBooks);
    } else {
      setBooksToShow(
        books.data.allBooks.filter(book => book.genres.includes(genre))
      );
    }
  };

  let genresList = books.data.allBooks.reduce(
    (singleArray, book) => singleArray.concat(book.genres),
    []
  );
  genresList = [...new Set(genresList)].concat('all genres');

  return (
    <div>
      <h2>books</h2>
      <div>in genre {genre}</div>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {booksToShow.map(a => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {genresList.map(genre => (
        <button onClick={() => filterGenres(genre)} key={genre}>
          {genre}
        </button>
      ))}
    </div>
  );
};

export default Books;
