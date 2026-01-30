import re
import uuid
from typing import Optional

BLOCK_TAGS = [
    "p",
    "div",
    "section",
    "article",
    "header",
    "footer",
    "main",
    "nav",
    "aside",
    "blockquote",
    "ul",
]


def join_list(joining_list: Optional[list], join_txt: str = "\n") -> str:
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

def _truncate_preserving_html(html_str: str) -> str:
    tag_stack: list = []  # Keep track of open tags
    output_tokens: list = []  # list of tokens

    # Match any tags or text
    tag_regex = re.compile(
        r"<[^>]+>"  # Match one or more HTML tags (starts with < and excludes the closing > while matching everything inside the tag.)
        r"|"  # Or
        r"[^<]+"  # Match one or more characters (excluding <)
    )

    for match in tag_regex.finditer(html_str):
        token = match.group(0)  # substring matched by regex
        output_tokens.append(token)

        if token.startswith("<"):  # Open Tag
            tag_name = re.match(
                r"</"  # Matches the begining of closing tag of an element
                r"(\w+)",  # Matches one or more word characters
                token,
            )
            if tag_name and token[1] == "/":  # Closing tag
                if tag_stack and tag_stack[-1] == tag_name.group(
                        1
                ):  # check if closing tag matches the last opened tag
                    tag_stack.pop()  # remove matched tag
            else:
                # Add non self-closing tags
                tag_name = re.match(
                    r"<"  # Matches the opening angle bracket of an HTML tag,
                    r"(\w+)",  # Matches one or more word characters
                    token,
                )
                if tag_name and not token.endswith("/>"):
                    tag_stack.append(tag_name.group(1))

    # Remove block-level closing tags from the end
    while output_tokens:
        last = output_tokens[-1]
        closing_match = re.match(r"</(\w+)>", last)
        if closing_match and closing_match.group(1) in BLOCK_TAGS:
            output_tokens.pop()
        else:
            break
    # Close any remaining open tags (excluding block-level)
    closing_tags = [f"</{tag}>" for tag in reversed(tag_stack) if tag not in BLOCK_TAGS]

    return "".join(output_tokens) + "".join(closing_tags)


def truncate_html_safe(value: str, max_length: int) -> str:
    if not value or len(value) <= max_length:
        return value

    truncated = value[:max_length]
    if contains_regex(truncated, r"<[^>]+>"):
        truncated = _truncate_preserving_html(truncated)

    return truncated
