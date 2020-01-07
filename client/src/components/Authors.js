import React, { useState } from 'react';
import Select from 'react-select';
import { useQuery, useMutation } from 'react-apollo';
import { gql } from 'apollo-boost';

export const ALL_AUTHORS = gql`
  {
    allAuthors {
      name
      born
      bookCount
    }
  }
`;

const EDIT_AUTHOR = gql`
  mutation editAuthor($name: String!, $setBornTo: Int!) {
    editAuthor(name: $name, setBornTo: $setBornTo) {
      name
      born
    }
  }
`;

const Authors = ({ show }) => {
  const authors = useQuery(ALL_AUTHORS);
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [year, setYear] = useState('');

  const [editAuthor] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }]
  });

  if (!show) {
    return null;
  }

  if (authors.loading) {
    return <div>Loading...</div>;
  }

  const updateBirthYear = async e => {
    e.preventDefault();
    await editAuthor({
      variables: { name: selectedAuthor, setBornTo: parseInt(year) }
    });

    setSelectedAuthor('');
    setYear('');
  };

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.data.allAuthors.map(a => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Set birthyear</h2>
      <form>
        <div>
          name
          <Select
            onChange={selected => setSelectedAuthor(selected.value)}
            options={authors.data.allAuthors.map(author => {
              return { value: author.name, label: author.name };
            })}
          />
        </div>
        <div>
          born
          <input
            value={year}
            onChange={({ target }) => setYear(target.value)}
            type="text"
          />
        </div>
        <button onClick={updateBirthYear}>update author</button>
      </form>
    </div>
  );
};

export default Authors;
