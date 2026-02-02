
# User Auth
User auth follows a standard [OAuth2 flow](https://oauth.net/2/) with [Login.gov](https://login.gov) as our backend provider.
Our API serves as a wrapper for a lot of the OAuth logic.

## Login Flow
```mermaid
sequenceDiagram
    autonumber
    participant frontend
    participant api
    participant login.gov

    frontend->>+api: user clicks login
    Note over api: /users/login

    api->>-login.gov: redirect
    activate login.gov
    Note over login.gov: /authorize
    login.gov->>+api: redirect
    deactivate login.gov

    Note over api: /users/login/callback
    break if an error occurs
        api->>frontend: redirect
    end
    api-->>login.gov: POST
    login.gov-->>api: id_token
    Note over login.gov: /token

    api->>-frontend: redirect
    Note over frontend: /auth/callback
  ```

At a high level, a user goes to our login endpoint, gets redirected to login.gov, logs in there,
and then gets redirected back to our API where we then create a session attached to the user
in our DB and return a key that can be used in other endpoints.

### Login
From the frontend, a user selects login, which sends them to the API's /users/login endpoint.

This endpoint sets up the parameters to call the [login.gov /authorize](https://developers.login.gov/oidc/authorization/) endpoint
which consists of several static configuration values (including where they should redirect when finished) plus two that change every request:
* state - A UUID that we will receive back from login.gov after the redirect
* [nonce](https://openid.net/specs/openid-connect-core-1_0.html#NonceNotes) - A UUID that we will receive back after requesting a token, helps prevent replay attacks

We store the state and nonce value in our `login_gov_state` DB table.

### Login.gov Authorize
A user logs into their account or makes a new account. After successfully completing
this process they are redirected back to our /users/login/callback endpoint where
the rest of the login process will occur.

### Callback Validation
We [receive a redirect back](https://developers.login.gov/oidc/authorization/#authorization-response) from login.gov with a code, state, and optionally errors if there was an issue.

If any error occurred, error.

We use the state value to fetch the state we stored previously in our database.
If the state does not exist, error.

If there was a state in our DB, before any further processing we delete the record.
Even if we later error, we do not want a state value to ever be re-usable to avoid
the potential for [replay attacks](https://en.wikipedia.org/wiki/Replay_attack).

### Getting the Login.gov Token
Using the code we received back from login.gov, we call their [token endpoint](https://developers.login.gov/oidc/token/).
To call the endpoint we also need a [client_assertion jwt](https://developers.login.gov/oidc/token/#client_assertion)
which is created from a private key we generated, and gave Login.gov the public key certificate.

If there is any error with [the response](https://developers.login.gov/oidc/token/#token-response) from login.gov, error.

We parse the JWT, validating it against the [public keys](https://developers.login.gov/oidc/certificates/)
provided by login.gov. We refresh these in the event we don't find a matching key based on the KID (key ID).

We additionally validate that the token is valid across several other fields (expired, audience, issuer, etc), but
most importantly we check that the `nonce` value in the key matches the one we originally sent to login.gov.
If any of these validations fail, we error.

### Creating our own JWT

If all validation passed, we'll then check if the `sub` value from the token matches
any user in `link_external_user` table. If not, we'll create a record + create a user.
In either case, we'll update the email from login.gov in this table.

We create a `user_token_session` object in our database which has a `token_id`, `expires_at` timestamp, and `is_valid` boolean.

The expiration of the token we create is not managed in the token itself, but instead in our database, and can be managed
by our logout and refresh endpoints.

With this session token we generate a JWT containing the `token_id`, `user_id` and a few miscellaneous JWT attributes.

### Redirect to final destination
With the token we redirect to the configured final destination URL with a message, token, and whether the user was new.

In future iterations we may adjust this logic to allow for the final destination to be set by the caller in the /users/login endpoint, however
for security reasons we'll want to limit where we can send to.

## Error handling
Because these aren't standard GET/POST/etc. endpoints and instead handle
all responses with redirects, we redirect to the same final destination in the event
an error occurs. We send an `error` and `error_description` parameter with rough
information about what issue occurred.

In both our login and callback endpoints we wrap the entire endpoint in a try/catch
block that handles catching errors and doing this redirect to the final destination.

Most errors fall into two categories:
* Misconfiguration in the API
* Someone is calling the callback URL directly with random data

Because we need to protect ourselves against both of these, many error scenarios
are actually not something we would ever expect a user to hit.

## Logout
The logout endpoint will log out the session associated with the passed-in token.

It does this by setting the `is_valid` boolean to False.

## Refresh
The refresh endpoint will extend how long the token is valid for of the passed-in token.

It does this by setting the `expires_at` timestamp to 30 minutes from now.

If a token is already expired, it cannot be refreshed.

## Using the token
In endpoints that support user authentication, you can pass a header like `X-SGG-Token <your token>` in order to authenticate.

You can see which endpoints currently support this by going to our [OpenAPI docs](https://api.simpler.grants.gov/docs)
and finding which endpoints can consume the `X-SGG-Token` header.

When an API endpoint that is configured to use JWT auth receives a token, it parses and validates the fields.
We use the public key we generated to verify that we were the ones who originally generated the token which
is largely where the security comes from.

If a token doesn't exist, is no longer valid, or has expired, we reject the request with a 401.

### Example
To enable this auth for a given endpoint, add `api_jwt_auth` to the auth required parameter
of your endpoint. Additionally, you can fetch the user token session object from the auth.

```py
from src.adapters import db
from src.adapters.db import flask_db
from src.api import response
from src.auth.api_jwt_auth import api_jwt_auth

@example_blueprint.post("/my-example")
@example_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def user_token_logout(db_session: db.Session) -> response.ApiResponse:

    user_token_session: UserTokenSession = api_jwt_auth.current_user  # type: ignore
    with db_session.begin():
        do_something(user_token_session.user)

    return response.ApiResponse("success")
```

# System-to-system Auth
Our system supports database-based API Key authentication. These are linked to specific users and can be passed via the X-API-Key header.


# Supporting multiple authentication schemes on an endpoint
An auth class called [MultiAuth](https://github.com/miguelgrinberg/Flask-HTTPAuth/blob/main/examples/multi_auth.py) exists
which can be used to define multiple auth approaches on a single endpoint that get checked in order.

However, it doesn't work with APIFlask which tries to pull information out that doesn't exist, and
can't be added as APIFlask expects at most a single security scheme per auth decorator.

We can work around this by not using the APIFlask decorator for your endpoint and instead doing:
```py
from typing import cast
import src.api.response as response

from src.auth.multi_auth import jwt_or_user_api_key_multi_auth, jwt_or_user_api_key_security_schemes, AuthType

@jwt_or_user_api_key_multi_auth.login_required
@example_blueprint.doc(security=jwt_or_user_api_key_security_schemes)
def my_example_endpoint() -> response.ApiResponse:
    user_container = jwt_or_user_api_key_multi_auth.get_user()
    if user_container.auth_type == AuthType.API_USER_KEY_AUTH:
        # User authenticated via X-API-Key header
        user_session = cast(UserApiKey, user_container.user)
    elif user_container.auth_type == AuthType.USER_JWT_AUTH:
        # User authenticated via X-SGG-Token header
        user_session = cast(UserTokenSession, user_container.user)

    # do auth stuff dependent on the type of user

    return response.ApiResponse(message="Success")
```
The two changes from an ordinary endpoint:
* Instead of doing `@example_blueprint.auth_required(auth_class)`, do `auth_class.login_required`. This changes nothing about how the auth actually works, it just avoids APIFlask from trying to parse it.
* Add the auth security schemes as a list of strings to the `security` object. The scheme values are what we pass into `security_scheme_name` function when creating the HTTPTokenAuth class objects like `api_jwt_auth`

Additionally, a utility class derived from `MultiAuth` has been created
to handle getting the user object and telling you what type they are.
