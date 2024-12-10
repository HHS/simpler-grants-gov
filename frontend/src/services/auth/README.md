# User Auth


### Notes

* Server components can't write cookies, but  middleware, route handlers and server actions can.



### Login flow

* user clicks "login"
    * client side component directs users to /api link
* user comes back with a simpler JWT to /auth/callback
    * verifies JWT
    * sets cookie
* useUser / UserProvider
    * checks cookie / API (see diagram)


```mermaid
flowchart TD
    checkCookie[Check cookie]
    cookieExists{Cookie Exists?}
    useUser/UserProvider --> checkCookie
    cookieValid{Cookie is Valid}
    redirectToLogin[redirect to login]

    checkCookie --> cookieExists
    cookieExists --> |Yes| cookieValid
    cookieExists --> |No| redirectToLogin
    cookieValid --> |Yes| d[Return User Data]
    cookieValid --> |No| redirectToLogin

```



## Next step


```mermaid
flowchart TD
    checkCookie[Check cookie]
    cookieExists{Cookie Exists?}
    useUser/UserProvider --> checkCookie
    cookieValid{Cookie is Valid}
    cookieIsCurrent{Cookie is Current}
    redirectToLogin[redirect to login]

    checkCookie --> cookieExists
    cookieExists --> |Yes| cookieValid
    cookieExists --> |No| redirectToLogin
    cookieValid --> |Yes| cookieIsCurrent
    cookieValid --> |No | redirectToLogin
    cookieIsCurrent --> |Yes| d[Return User Data]
    cookieIsCurrent --> |No| e{User exists with session from /api/user}
    e --> |Yes| f[set cookie]
    e --> |No| redirectToLogin

```
