def escape_like(text: str, escape_char: str = "*") -> str:
    return (
        text.replace(escape_char, escape_char * 2)
        .replace("%", escape_char + "%")
        .replace("_", escape_char + "_")
    )
