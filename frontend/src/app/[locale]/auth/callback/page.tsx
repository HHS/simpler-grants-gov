import { headers } from 'next/headers'

// Accept token
// Verify token (optional for now)
// Set cookie
// Redirect to homepage

export default async function Page() {

  const headersList = await headers()
  const jwt = headersList.get('set-cookie');
  console.log(jwt);
  return <h2>{jwt}</h2>;

}
