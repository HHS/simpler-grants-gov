# Dead Letter Queue Redrive in Workflow Management

## Overview
This guide explains how to manage messages in the Simpler Grants workflow management Dead Letter Queue (DLQ), including understanding why messages end up in the DLQ, when to redrive vs delete, and step-by-step procedures for both operations.

System Context: 
- Main Queue: `local-workflow-queue` (or environment-specific name)
- DLQ: `local-workflow-queue-dlq` (or environment-specific name)
- Workflow Service: Runs via `make cmd args="workflow workflow-main"`
- Max Receive Count: 3 attempts before moving to DLQ

**Note**: As the redrive/delete is through AWS Console, access to the AWS account of the environment you want to run this in is required.


## Dead Letter Queue (DLQ)
In workflow management, the DLQ is used to receive and keep messages failed to process from the main queue, after 3 attempts. 
Users can check messages in DLQ for further analysis, identify the issue, and make decision for redrive or delete.


## When do messages go to the DLQ?
- Retryable errors
    - **UnexpectedStateError** - Workflow in unexpected state
        - Missing target state in transition
    - **ImplementationMissingError** - Missing configuration/implementation
        - Missing entity type configuration
        - Missing approval config
- General/unexpected errors<br>
    Any exception not caught as `RetryableWorkflowError` or `NonRetryableWorkflowError`:
    - Database timeouts
    - Network issues
    - Unexpected Python exceptions
- Validation errors


## Investigating DLQ Messages

Before taking action on DLQ messages, investigate the root cause:

### What to check:

1. Message content in AWS Console
- Go to AWS Console → SQS → `local-workflow-queue-dlq` (or your environment's DLQ)
- Click "Send and receive messages" → "Poll for messages"
- Review message body for:
  - Missing required fields (e.g. `event_id`, `acting_user_id`)
  - Invalid `workflow_id` or `event_type`
  - Malformed JSON structure

2. Workflow service logs
- `"Failed to validate SQS message as WorkflowEvent"` - Validation errors
- `"Encountered retryable workflow error"` - Retryable errors (UnexpectedStateError, ImplementationMissingError)
- `"Encountered non-retryable workflow error"` - Non-retryable errors (these don't go to DLQ)
- `"Workflow event handler exceeded timeout"` - Processing timeouts
- `"Unexpected error processing workflow event"` - General exceptions

3. Workflow data in database
- Check workflow state and history:
  ```sql
  -- Find workflow by ID from the message
  SELECT * FROM workflow WHERE id = '<workflow_id>';
  
  -- Check workflow event history
  SELECT * FROM workflow_event_history 
  WHERE workflow_id = '<workflow_id>' 
  ORDER BY created_at DESC;
  
  -- Check if workflow is in unexpected state
  SELECT id, current_state, entity_type 
  FROM workflow 
  WHERE id = '<workflow_id>';
  ```

4. Related entity data, depending on `entity_type`
  - **Opportunity**: Check `opportunity` table
  - **Award Recommendation**: Check `award_recommendation` table
  - Verify the entity still exists and is in a valid state

5. Application monitoring and logs
  - Check New Relic for additional context and error details, on either API or workflow dashboard


## DLQ message redrive
**Critical**: Always resolve the underlying issue before redriving messages, otherwise they will fail again and return to the DLQ after 3 more attempts.

### Steps
1. Confirm the DLQ message availability, then click the "Start DLQ redrive" button on top-right corner.
![DLQ redrive step 1](images/DLQ-redrive-1.png)

2. Make selection for "Message destination" and "Velocity control settings", then click "DLQ redrive" to proceed. It may take a few seconds for the message to move out.
![DLQ redrive step 2](images/DLQ-redrive-2.png)

### What happens after redrive:
- Messages are moved back to the main queue (`local-workflow-queue`)
- Workflow service picks them up automatically (polls every 10 seconds by default)
- If processing succeeds → messages are deleted and you'll see success message from the log
- If processing fails again → messages return to DLQ after 3 more attempts

### Verifying the fix worked:
1. Check workflow service logs for successful processing
2. Query database to verify workflow state changed:
   ```sql
   SELECT id, current_state, updated_at 
   FROM workflow 
   WHERE id = '<workflow_id>';
   ```
3. Confirm DLQ is empty (or only expected messages remain)


## DLQ message delete
The DLQ messages can be deleted when reprocessing is not needed.
For example, in the following cases:
- Message is malformed and cannot be fixed (e.g., missing required fields with no way to reconstruct)
- Workflow or entity has been manually deleted from the database

**⚠️ Warning**: Deletion is permanent. Messages cannot be recovered after deletion.

Users can either delete specific message(s) or purge all messages at a time.

### Steps for deleting specific message(s)
1. Click "Send and receive messages" 
2. From next page, poll for the messages
3. Make selections, then click "Delete"
![DLQ delete specific message](images/DLQ-delete-specific-message.png)

### Steps for deleting all message(s) (purge)
1. Click "Purge" on top-right corner
2. Type "purge" to confirm, then click "Purge" button
![DLQ purge messages](images/DLQ-purge-messages.png)
