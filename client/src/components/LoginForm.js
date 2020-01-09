import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-apollo';
import { gql } from 'apollo-boost';

const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      value
    }
  }
`;

const LoginForm = ({ show, handleSetToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [login] = useMutation(LOGIN);

  if (!show) {
    return null;
  }

  const submit = async event => {
    event.preventDefault();

    const result = await login({
      variables: { username, password }
    });

    if (result) {
      const token = result.data.login.value;
      handleSetToken(token);
      localStorage.setItem('gql-library', token);

      console.log(localStorage.getItem('gql-library'));
    }
  };

  return (
    <div>
      <form onSubmit={submit}>
        <div>
          username{' '}
          <input
            value={username}
            onChange={({ target }) => setUsername(target.value)}
          />
        </div>
        <div>
          password{' '}
          <input
            type="password"
            value={password}
            onChange={({ target }) => setPassword(target.value)}
          />
        </div>
        <button type="submit">login</button>
      </form>
    </div>
  );
};

export default LoginForm;
