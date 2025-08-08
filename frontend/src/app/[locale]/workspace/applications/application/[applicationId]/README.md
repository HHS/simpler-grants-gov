## How to get here for local testing

### obtain the id for an opportunity with an open competition

In your local database, look in the `competition` table for any opportunity ID

### visit the opportunity page

Using this id, visit http://localhost:3000/opportunity/<your opportunity id>?\_ff=applyFormPrototypeOff:false

The `_ff` param is to ensure that the correct feature flag is set to allow for starting and application

### log in

You need to be logged in in order to start an application

### start an application (no organization required)

Click "start new application", enter a name and you should be good

### start an application (organization required)

You'll need to associate your user with an existing organization.

First find your user id by looking at the `user_token_session` table, there should only be one user id there.

In the `organization_user` table, insert your user id in place of one of the existing `user_id`s in the table

Now, when you click "start new application" the "who's applying" drop down should have an option in it, and you should be able to apply to competitions that are restricted to organizations only.
