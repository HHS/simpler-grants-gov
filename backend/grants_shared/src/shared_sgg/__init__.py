print("in shared_sgg init")

from .example import example_function

def thing():
    print("thing?")

__all__ = [
    "example_function"
]