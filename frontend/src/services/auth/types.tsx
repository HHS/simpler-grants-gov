import { ReactElement } from "react";

/**
 * Configure the {@link UserProvider} component.
 *
 * If you have any server-side rendered pages (using `getServerSideProps` or Server Components), you should get the
 * user from the server-side session and pass it to the `<UserProvider>` component via the `user`
 * prop. This will prefill the {@link useUser} hook with the {@link UserProfile} object.
 * For example:
 *
 * import { UserProvider } from 'src/services/auth/UserProvider';
 *
 * export default async function RootLayout({ children }) {
 *   // this will emit a warning because Server Components cannot write to cookies
 *   // see https://github.com/auth0/nextjs-auth0#using-this-sdk-with-react-server-components
 *   const session = await getSession();
 *
 *   return (
 *     <html lang="en">
 *       <body>
 *         <UserProvider user={session?.user}>
 *           {children}
 *         </UserProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 *
 * In client-side rendered pages, the {@link useUser} hook uses a {@link UserFetcher} to fetch the
 * user from the profile API route. If needed, you can specify a custom fetcher here in the
 * `fetcher` option.
 *
 *
 * @category Client
 */
export type UserProviderProps = React.PropsWithChildren<
  { user?: SessionPayload; userEndpoint?: string; fetcher?: UserFetcher }
>;

/**
 * To use the {@link useUser} hook, you must wrap your application in a `<UserProvider>` component.
 *
 * @category Client
 */
export type UserProvider = (props: UserProviderProps) => ReactElement<UserContextType>;

/**
 * The user claims returned from the {@link useUser} hook.
 *
 * @category Client
 */
export interface UserProfile {
  name?: string | null;
}

/**
 * The user context returned from the {@link useUser} hook.
 *
 * @category Client
 */
export type UserContextType = {
  user?: Session;
  error?: Error;
  isLoading: boolean;
  checkSession: () => Promise<void>;
};

/**
 * @ignore
 */
export type UserProviderState = {
    user?: Session;
    error?: Error;
    isLoading: boolean;
  };

export type SessionPayload = {
  token: string;
  expiresAt: Date;
};

export type Session = {
  token: string;
  expiresAt?: Date;
} | null;

/**
 * Fetches the user from the profile API route to fill the {@link useUser} hook with the
 * {@link UserProfile} object.
 *
 * If needed, you can pass a custom fetcher to the {@link UserProvider} component via the
 * {@link UserProviderProps.fetcher} prop.
 *
 * @throws {@link RequestError}
 */
export type UserFetcher = (url: string) => Promise<SessionPayload | undefined>;
