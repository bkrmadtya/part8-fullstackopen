import React from 'react';
import { useQuery } from 'react-apollo';
import { gql } from 'apollo-boost';

import { ALL_BOOKS } from './Books';

export const ME = gql`
  {
    me {
      username
      favoriteGenre
    }
  }
`;

const Recommended = props => {
  const me = useQuery(ME);
  const books = useQuery(ALL_BOOKS);

  if (!props.show) {
    return null;
  }

  if (me.loading && books.loading) {
    return <div>Loading...</div>;
  }

  const favoriteGenre = me.data.me.favoriteGenre;
  console.log(me.data.me.favoriteGenre);

  return (
    <div>
      <h2>recommendations</h2>
      <div>books in your favorite genre {favoriteGenre}</div>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.data.allBooks
            .filter(a => a.genres.includes(favoriteGenre))
            .map(book => (
              <tr key={book.title}>
                <td>{book.title}</td>
                <td>{book.author.name}</td>
                <td>{book.published}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default Recommended;
