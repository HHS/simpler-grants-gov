import React, { useEffect, useState } from "react";

import { DataFetcher } from "./datafetcher";
import { User } from "./usersMock";

interface UsersListProps {
  dataFetcher: DataFetcher<User>;
}

const UsersList: React.FC<UsersListProps> = ({ dataFetcher }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // flag to check if the component is still mounted

    dataFetcher
      .fetchData()
      .then((fetchedUsers) => {
        if (isMounted) {
          setUsers(fetchedUsers);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (isMounted) {
          console.error("Error fetching users:", error);
          setLoading(false);
          // Optionally, set some state to show an error message
        }
      });

    // Cleanup function to set the flag to false when the component unmounts
    return () => {
      isMounted = false;
    };
  }, [dataFetcher]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Users List</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UsersList;
