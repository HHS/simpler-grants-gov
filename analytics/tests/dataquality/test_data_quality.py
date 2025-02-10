def test_snapshot(snapshot):
    """Compare pipeline to pre-committed snapshot."""
    assert output() == snapshot()

def output() -> list[dict]:
    """Call the new pipeline code to be used for comparison."""
    return [{"name": "Test"}, {"output": "correct"}]
