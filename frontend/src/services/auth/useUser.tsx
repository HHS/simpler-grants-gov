'use client';
import React, { ReactElement, useState, useEffect, useCallback, useContext, createContext, useMemo } from 'react';

import { UserContextType } from './types';

/**
 * @ignore
 */
const missingUserProvider = 'You forgot to wrap your app in <UserProvider>';

/**
 * @ignore
 */
export const UserContext = createContext<UserContextType>({
  get user(): never {
    throw new Error(missingUserProvider);
  },
  get error(): never {
    throw new Error(missingUserProvider);
  },
  get isLoading(): never {
    throw new Error(missingUserProvider);
  },
  checkSession: (): never => {
    throw new Error(missingUserProvider);
  }
});

/**
 * @ignore
 */
export type UseUser = () => UserContextType;

/**
 * The `useUser` hook, which will get you the {@link UserProfile} object from the server-side session by fetching it
 * from the {@link HandleProfile} API route.
 *
 * ```js
 * import Link from 'next/link';
 * import { useUser } from 'src/services/auth/useUser';
 *
 * export default function Profile() {
 *   const { user, error, isLoading } = useUser();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>{error.message}</div>;
 *   if (!user) return <Link href="/api/auth/login"><a>Login</a></Link>;
 *   return <div>Hello {user.name}, <Link href="/api/auth/logout"><a>Logout</a></Link></div>;
 * }
 * ```
 *
 * @category Client
 */
export const useUser: UseUser = () => useContext<UserContextType>(UserContext);
