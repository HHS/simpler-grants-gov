import uuid


def join_list(joining_list: list | None, join_txt: str = "\n") -> str:
    """
    Utility to join a list.

    Functionally equivalent to:
    "" if joining_list is None else "\n".join(joining_list)
    """
    if not joining_list:
        return ""

    return join_txt.join(joining_list)


def is_valid_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
        return True
    except ValueError:
        return False