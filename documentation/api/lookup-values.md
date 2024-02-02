# Overview

A lookup value is a set of allowed values for a given field. This includes:
* Opportunity Categories (eg. discretionary, mandatory, continuation, earmark, other)
* Opportunity Status (eg. forecasted, posted, closed, archived)
* Funding Instrument (eg. cooperative agreement, grant, procurement contract, other)
* and many more

These lookup values are used throughout the system serving as both the allowed values in requests,
as well as the database. Each lookup value has a corresponding database table that dictates what
values are allowed in the DB by using foreign keys.

# Setting up a lookup value

Lookup values are defined in [lookup_constants.py](/api/src/constants/lookup_constants.py) and are
just simple Python enums.

For example, if we wanted to add a new lookup value, we could add:

```py
from enum import StrEnum

class Example(StrEnum):
    A = "a"
    B = "b"
    C = "c"
    D = "d"
```

This would allow any values a,b,c,d - note that the value, and not the name of the
lookup variable is used. `A` would not be considered valid while `a` would.

## Using a lookup value in a Marshmallow schema

See [routes](api-details.md#routes) for details on how the Marshmallow schemas work.

Enums are directly supported as a field type, and only require specifying the field like:

```py
from src.api.schemas.extension import Schema, fields

class ExampleSchema(Schema):

    my_example_field = fields.Enum(
        Example, metadata={"description": "The example field", "example": Example.A}
    )
```

The OpenAPI schema generated will automatically handle specifying which fields are allowed
and error if any non-specified values are submitted. No additional configuration necessary.

## Lookup values in our Postgres DB

In order to provide additional validation at the DB layer, as well as make it clear what values are allowed
we have setup a lookup table for any lookup value that gets stored in the database.

These tables are always named as `lk_<lookup>`, and have two columns `<lookup>_id` and `description`.

In this case, we would want to make a table named `lk_example`, with `example_id` as a primary key.

The `<lookup>_id` column is an integer that we define, while the description is the value of the enum.

### Setting up a lookup value in Postgres

First, we need to define the `<lookup>_id` column value for each enum value. This is simply defined
as a simple mapping next to the enum. For example, this would be defined as:

```py
from src.db.models.lookup  import LookupConfig, LookupStr

EXAMPLE_CONFIG = LookupConfig([
        LookupStr(Example.A, 1),
        LookupStr(Example.B, 2),
        LookupStr(Example.C, 3),
        LookupStr(Example.D, 4),
    ]
)
```

Then we want to define the lookup table in [lookup_models.py](/api/src/db/models/lookup_models.py) as:

```py
from sqlalchemy.orm import Mapped, mapped_column

import src.constants.lookup_constants as lookup_constants
from src.db.models.lookup import Lookup, LookupRegistry, LookupTable
from src.db.models.base import TimestampMixin

@LookupRegistry.register_lookup(lookup_constants.EXAMPLE_CONFIG)
class LkExample(LookupTable, TimestampMixin):
    __tablename__ = "lk_example"

    example_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkExample":
        return LkExample(example_id=lookup.lookup_val, description=lookup.get_description())
```

The table definition itself is pretty straightforward, and follows our usual approach to any SQLAlchemy model.

The [LookupRegistry](/api/src/db/models/lookup/lookup_registry.py) is a global registry that defines the table for each lookup value. This is used in two ways:
1. When running DB migrations, the enum values will be merged into the corresponding Lookup table automatically
2. When defining a database table with a foreign key to these lookup values, handles converting to/from an enum.

In order to reference these lookup values on another table, you just need to define it like so:

```py
import uuid
from typing import Optional

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from src.db.models.base import TimestampMixin
from src.db.models.lookup_models import LkExample
from src.db.models.base import Base
from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import Example

class ExampleTable(Base, TimestampMixin):
    __tablename__ = "example_table"

    example_table_id: Mapped[int] = mapped_column(primary_key=True)

    example: Optional[Example] = mapped_column(
        "example_id", LookupColumn(LkExample), ForeignKey(LkExample.example_id)
    )
```

When working with this DB model, you don't need to worry about the fact that the value in the DB
is actually an integer, by having registered the lookup table, the `LookupColumn` type will automatically
handle converting to and from the DB and you only ever need to work with the enum value.
