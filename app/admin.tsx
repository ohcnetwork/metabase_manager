import { useState, useEffect } from 'react';
import axios from 'axios';
import { requireAuthentication } from './middleware';

export async function getServerSideProps(context) {
  await requireAuthentication(context.req, context.res, () => {});

  return { props: {} };
}

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    }
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/signup', { username, password });
      setUsername('');
      setPassword('');
      setError('');
    } catch (error) {
      setError('User already exists');
    }
  };

  return (
    <div className="container">
      <h1>Admin Page</h1>
      <form onSubmit={handleCreateUser}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Create User</button>
      </form>
      {error && <p className="error">{error}</p>}
      <h2>Existing Users</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.username}</li>
        ))}
      </ul>
    </div>
  );
}
