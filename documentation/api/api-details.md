# API Details

See [Technical Overview](./technical-overview.md) for details on the technologies used.

Each endpoint is configured in the [openapi.generated.yml](/api/openapi.generated.yml) file which provides basic request validation. Each endpoint specifies an `operationId` that maps to a function defined in the code that will handle the request.

To make handling a request easier, an [ApiContext](/api/src/util/api_context.py) exists which will fetch the DB session, request body, and current user. This can be used like so:
```py
def example_post() -> flask.Response:
    with api_context_manager() as api_context:
        # Work with the request body
        first_name = api_context.request_body["first_name"]

        # Work with the user
        current_user = api_context.current_user

        # Work with the DB session
        api_context.db_session.query(..)

        # Return a response
        return response_util.success_response(
            message="Success",
            data={"db_model_id": "1234"}, # Whatever the response object should be
            status_code=201
            )
```
For more complex usages, it is recommended you put the implementation into a separate handler file in order to keep the API entrypoints easier to read.

# Swagger

The Swagger UI  can be reached locally at [http://localhost:8080/docs](http://localhost:8080/docs) when running the API. The UI is based on the [openapi.generated.yml](/api/openapi.generated.yml) file.
![Swagger UI](/docs/api/images/swagger-ui.png)

Each of the endpoints you've described in your openapi.generated.yml file will appear here, organized based on their defined tags. For any endpoints with authentication added, you can add your authentication information by selecting `Authorize` in the top right.
![Swagger Auth](/docs/api/images/swagger-auth.png)

All model schemas defined can be found at the bottom of the UI.

# Routes

## Health Check
[GET /v1/healthcheck](/api/src/route/healthcheck.py) is an endpoint for checking the health of the service. It verifies that the database is reachable, and that the API service itself is up and running.

Note this endpoint explicitly does not require authorization so it can be integrated with any automated monitoring you may build.

### Example Response
![Example Response](/docs/api/images/healthcheck-response.png)
