# Overview
This folder contains functionality for running our
workflows via state machines.

Many more docs are coming soon, this doc especially
is very much a work-in-progress as we build out the logic.


# How-to

## Add a new entity type
Each workflow can connect to entities (eg. opportunity or application).
If we want to add support for new types of entities, we need to do
the following.

1. Add the entity type to `WorkflowEntityType`
2. Add a DB table linking the workflow to the entity. Look at tables
   like the workflow_opportunity table as an example. Along with this
   you will want to setup the relationships to the entity for ease of use.
3. Add a new persistence class derived from `BaseStatePersistenceModel`
   with the type you want to use. This will be used as the connection between
   a state machine and the database.
4. Update the logic in `workflow_service.py` for the `get_workflow_entities`
   function to fetch this type of entity.
