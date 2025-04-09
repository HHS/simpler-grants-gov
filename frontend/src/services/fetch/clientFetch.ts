import Cookies from "js-cookie";
import { useUser } from "src/services/auth/useUser";

/*
  problem with just looking at 401 codes there is that the request we're looking at may not itself require authentication, so a 200 response may be fine there but we still want to react
  all 401s SHOULD be handled by the system we're building, but we could also explicitly look at 401s

  but what to do on server based requests? is there a way to handle both cases?
  can we assume that any server side fetch will be as the result of a route change, or the result of proxying through a frontend request? If so we can handle those using route change based checks
  I think we can assume that, other than subscription (not in scope as it is a 3rd party request) and possibly future apply functions, which are server actions.

  for server actions... not all server actions will require authentication, so we can't rely solely on 401s
  we could build a simplerActionsFetch function mirroring the client side functionality. Problem there is that we need to find a more indirect way to get the frontend to react to the change
  we can try and build a specific wrapper for actions, but if time runs out let's skip them for now and deal with them when the issue comes up?

  most functions are encapsulated either in the server fetch abstraction or client fetcher functions. Exceptions in OpportutnitySaveUserControl and UserControl
*/

/*
  what are our test cases

  - let's set expiration at 1 min
  - login
  - wait 1 min
  - - navigate to a new route
  - - - middleware should be hit, we should have an expired token, token should be removed, frontend should notice (based on useRouter based functionality tbd) and respond
  - - save an opportunity
  - - - fetch function should be hit, middleware stuff should remove the cookie, fetch function will refresh the user, user refresh logic (tbd) should respond

*/
export const useClientFetch = <T>(
  errorMessage: string,
  jsonResponse = true,
) => {
  const { refreshUser } = useUser();

  const fetchWithAuthCheck = async (
    url: string,
    options: RequestInit = {},
  ): Promise<Response> => {
    const sessionExpiration = Cookies.get("session_expiration");
    if (sessionExpiration && parseInt(sessionExpiration) < Date.now()) {
      await refreshUser();
    }
    const response = await fetch(url, options);
    if (response.status === 401) {
      await refreshUser();
      return response;
    }
    return response;
  };

  // when this function is used in a useEffect block the linter will want you to add it to the
  // dependency array. Unfortunately, right now, likely because this hook depends on useUser,
  // adding this a dependency will cause an infinite re-render loop. We should look into fixing this
  // but for the moment do not include this in dependency arrays. - DWS
  const clientFetch = async (
    url: string,
    options: RequestInit = {},
  ): Promise<T> => {
    const response = await fetchWithAuthCheck(url, options);
    if (response.ok && response.status === 200) {
      if (jsonResponse) {
        const data = (await response.json()) as T;
        return data;
      }
      return response as T;
    } else {
      throw new Error(`${errorMessage}: ${response.status}`);
    }
  };
  return {
    clientFetch,
  };
};
