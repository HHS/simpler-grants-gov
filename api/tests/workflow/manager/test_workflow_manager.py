from src.workflow.manager.workflow_manager import WorkflowManager, WorkflowManagerConfig


def test_workflow_manager(app):
    """Very basic test just to have something

    Will be refactored/iterated on significantly
    as we build out more functionality.
    """
    # Don't actually sleep in the test
    config = WorkflowManagerConfig(workflow_cycle_duration=0, workflow_maximum_batch_count=3)
    workflow_manager = WorkflowManager(config=config)

    with app.app_context():
        workflow_manager.process_events()

    metrics = workflow_manager.metrics
    assert metrics["batches_processed"] == 3
    assert metrics["events_processed"] >= 3
