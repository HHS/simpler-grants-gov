from src.workflow.registry.workflow_registry import WorkflowRegistry


def test_state_machines_configured_as_expected():
    """This test verifies that a workflow is configured as expected.

    This test does not test things that are validated automatically
    be other mechanisms (type checking or defined logic) but instead
    makes sure that our workflows follow certain patterns that we
    expect of them.
    """

    # We'll collect all errors and then log them out at the end
    # in case a developer does have issues, they get told all of them
    # at once.
    errors = []
    for _, state_machine_cls in WorkflowRegistry._workflow_registry.values():

        # Every workflow should have a "start_workflow" transition
        # so that we can easily handle a start workflow event.
        transitions = set([e.id for e in state_machine_cls.events])

        if "start_workflow" not in transitions:
            errors.append(
                f"start_workflow missing from defined transitions for {state_machine_cls.__name__}"
            )

    assert len(errors) == 0, "\n".join(errors)
