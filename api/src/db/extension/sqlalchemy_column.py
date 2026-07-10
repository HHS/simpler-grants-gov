import sqlalchemy


class StripZerosText(sqlalchemy.Text):
    """SQLAlchemy column type for a TEXT column that
    if used in the foreign data wrapper SQL generation script
    will render with "OPTIONS (strip_zeros 'true')" included.

    Stripping the zeros avoids a character encoding issue for
    converting Oracle columns that contain 0x00 bytes.

    If used in any other context, identical to sqlalchemy.Text.

    See: https://github.com/laurenz/oracle_fdw#column-options for
    further information about strip_zeros.
    """

    pass
