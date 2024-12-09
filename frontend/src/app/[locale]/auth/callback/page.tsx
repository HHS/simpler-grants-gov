import { headers } from 'next/headers';
import { authAction } from 'src/services/auth/actions';
import { initialAuth } from 'src/services/auth/initialAuth';
// Accept token
// Verify token (optional for now)
// Set cookie
// Redirect to homepage
// Maybe we don't use a single page and just wrap all auth areas
// in a provider?
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const token = (await searchParams).token as string;
  if (token) {
    await authAction(token);
    return <h2>You should be redirected</h2>;
  }
  else {
    // redirect?
    return <h2>No token no bueno</h2>;
  }
}
