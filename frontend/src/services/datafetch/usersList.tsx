import React, { useEffect, useState } from 'react';

import { DataFetcher } from './datafetcher';
import { User } from './usersMock';

interface UsersListProps {
  dataFetcher: DataFetcher<User>;
}


const UsersList: React.FC<UsersListProps> = ({ dataFetcher }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataFetcher.fetchData().then((fetchedUsers) => {
      setUsers(fetchedUsers);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Users List</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name} - {user.email}</li>
        ))}
      </ul>
    </div>
  );
};

export default UsersList;
