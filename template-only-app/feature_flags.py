import os

def is_feature_enabled(feature_name: str) -> bool:
    value = os.environ.get(f"FF_{feature_name}")
    return value == "true" if value else False
