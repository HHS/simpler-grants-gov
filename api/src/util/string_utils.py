import re
import uuid

from bs4 import BeautifulSoup, NavigableString


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


def contains_regex(value: str, regex: str) -> bool:
    return bool(re.search(regex, value))


def _strip_partial_tag(html: str) -> str:
    """
    Remove a trailing partial HTML tag, if present.
    Safe for nested and previously closed tags.
    """
    i = len(html) - 1

    while i >= 0:
        if html[i] == ">":
            # Found a complete tag end before any '<' → safe
            return html
        if html[i] == "<":
            # Found start of a tag with no closing '>' → strip it
            return html[:i]
        i -= 1

    return html


def truncate_html_inline(value: str, max_length: int, suffix: str) -> str:
    """
    Truncate visible text inside HTML while preserving valid structure.

    - Only text nodes are truncated (never tags).
    - HTML structure remains valid.
    - The suffix is appended inline inside the last text node.
    """
    if not value or len(value) <= max_length:
        return value

    # Parse the HTML into a tree structure
    soup = BeautifulSoup(value, "html.parser")

    total_length = 0
    reached_limit = False

    # Walk through all text nodes in document order
    for text_node in soup.find_all(string=True):

        if reached_limit:
            # Remove any remaining text after truncation point
            text_node.extract()
            continue

        text = str(text_node)
        remaining = max_length - total_length

        if len(text) <= remaining:
            # Entire text node fits within limit
            total_length += len(text)
        else:
            # Truncate inside the text node
            truncated_text = text[:remaining].rstrip()

            # Create new truncated text node
            new_text_node = NavigableString(truncated_text)

            # Replace original text node with truncated one
            text_node.replace_with(new_text_node)

            # Append suffix
            suffix_fragment = BeautifulSoup(suffix, "html.parser")
            new_text_node.insert_after(suffix_fragment)

            # Remove all remaining content after this point
            node = suffix_fragment.next_sibling
            while node:
                next_node = node.next_sibling
                node.extract()
                node = next_node

            break

    return str(soup)
