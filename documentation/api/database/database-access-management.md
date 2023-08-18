# Database Access Management

This document describes the best practices and patterns for how the application accesses and updates data in the database.

## Client Initialization and Configuration

The database client is initialized when the application starts (see [src/app.py](../../../api/src/app.py). The database engine that is used to create acquire connections to the database is initialized using the database configuration defined in [db_config.py](../../../app/src/db/db_config.py), which is configured through environment variables. The initialized database client is then stored on the Flask app's [\`extensions\` dictionary](https://flask.palletsprojects.com/en/2.2.x/src/#flask.Flask.extensions) to be used throughout the lifetime of the application.

## Session Management

A new database session should be created for each web request and passed into service methods. As a general rule, create the session outside of functions and objects that access and/or manipulate database data. This will greatly help with achieving a predictable and consistent transactional scope. For example:

For example, **do this**

```python
### right way ###

from flask import current_app
import src.adapters.db as db

def some_service_func(session: db.Session)
    with db_session.begin(): # start transaction
        session.query(FooBar).update({"x": 5})

@app.post("/some-service")
def some_service_post():
    db_client = db.get_db(current_app)
    with db.get_session() as db_session: # create session
        some_service_func(db_session)
```

and **don't do this**

```python
### wrong way ###

from flask import current_app
import src.adapters.db as db

def some_service_func()
    db_client = db.get_db(current_app)
    with db.get_session() as db_session:
        with db_session.begin():
            session.query(FooBar).update({"x": 5})

@app.post("/some-service")
def some_service_post():
    some_service_func()
```

For more information, see [SQLAlchemy FAQ: When do I construct a \`Session\`, when do I commit it, and when do I close it?](https://docs.sqlalchemy.org/en/14/orm/session_basics.html#session-faq-whentocreate)

## Transactions

Make sure to understand the concept of transactions and the [ACID properties of transactions](https://en.wikipedia.org/wiki/ACID).

To start a new transaction, use `session.begin()`. For example

```python
def service_method(session: db.Session):
    with session.begin(): # start database transaction
        session.query(...)
        session.add(...)
        session.delete(...)
```

It is important that any database write operations occur in the same transaction as database read operations that the writes are based on. This is especially important since the application has `session.expire_on_commit` set to `False`, so unintentionally accessing model objects that were read from the database in a closed transaction will not produce an obvious error.

For example, **don't do this**:

```python
# incorrect

def withdraw(session: db.Session, account_id, amount):
    with session.begin():
        bank_account = session.query(BankAccount).get(account_id)
    with session.begin():
        if bank_account.balance >= amount: # the balance could be out of date!
            bank_account.balance -= amount
```

### Code Smells

It is generally not necessary to [refresh or expire the session](https://docs.sqlalchemy.org/en/14/orm/session_state_management.html#refreshing-expiring). Doing so could lead to additional database queries being triggered.

Manually calls to refresh or expire a session could potentially indicate the need for separate transactions.

## Database Sessions vs Web Sessions vs Test Sessions

Note that a database session is not the same thing as a web session or a test session.

A database session refers to the period of time during which a user is connected to a database and can execute database queries and transactions. In a web application, this is typically the lifetime of a single web request. Or for a batch job, this is typically the lifetime of the job. A web session, on the other hand, refers to the period of time during which a user interacts with a website. Finally, a test session is the period of time of a single run of the test suite, and is what is referred to in fixtures that have `scope="session"`.

## References

* [SQLAlchemy FAQ: When do I construct a \`Session\`, when do I commit it, and when do I close it?](https://docs.sqlalchemy.org/en/14/orm/session_basics.html#session-faq-whentocreate)
* [Refreshing / Expiring the Session](https://docs.sqlalchemy.org/en/14/orm/session_state_management.html#refreshing-expiring)
