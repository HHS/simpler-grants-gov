"""Test utilities to help with parametrization of tests."""

from itertools import chain, combinations


def powerset(iterable):
    """
    Return the power set of an iterable, where each subset is a list.
    The power set is the set of subsets of a set, including the empty
    set and the set itself.

    An example use case is if there are a set of roles that a user can have,
    and you want to parametrize a test with all possible combinations of roles.

    Example:
    powerset([1,2,3]) --> [] [1] [2] [3] [1,2] [1,3] [2,3] [1,2,3]
    """
    s = list(iterable)
    return map(list, chain.from_iterable(combinations(s, r) for r in range(len(s) + 1)))
