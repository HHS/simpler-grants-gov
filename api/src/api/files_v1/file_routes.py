import logging
import uuid
from collections.abc import Iterator

from flask import Response, stream_with_context
from grants_shared.logs.flask_logger import add_extra_data_to_current_request_logs

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.api.files_v1.file_schemas as file_schemas
import src.api.response as response
from src.adapters.aws.dynamodb_adapter import DynamoDBClient
from src.api.files_v1.file_blueprint import file_blueprint
from src.auth.api_user_key_auth import api_user_key_auth
from src.auth.multi_auth import jwt_or_api_user_key_multi_auth
from src.services.files.create_presigned_upload import create_presigned_upload
from src.services.files.stream_file_scan_results import stream_file_scan_results
from src.services.files.update_pending_file_scan_status import update_pending_file_scan_status

logger = logging.getLogger(__name__)


@file_blueprint.post("")
@file_blueprint.input(file_schemas.CreatePresignedUploadRequestSchema, location="json")
@file_blueprint.output(file_schemas.CreatePresignedUploadResponseSchema)
@file_blueprint.doc(
    summary="Create a presigned upload URL",
    description=(
        "Generate a presigned s3 URL the caller can POST a file to. Creates a "
        "pending file record and a DynamoDB row tracking the scan status. The "
        "caller is responsible for performing the multipart POST to the "
        "returned URL with the returned body fields and the file attached."
    ),
    responses=[200, 401, 429],
)
@file_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
@flask_db.with_db_session()
def create_presigned_upload_route(db_session: db.Session, json_data: dict) -> response.ApiResponse:
    user = jwt_or_api_user_key_multi_auth.get_user()
    add_extra_data_to_current_request_logs({"user_id": user.user_id})
    logger.info("POST /v1/files")

    with db_session.begin():
        db_session.add(user)
        result = create_presigned_upload(
            db_session=db_session,
            user=user,
            request_data=json_data,
            dynamodb_client=DynamoDBClient(),
        )

    add_extra_data_to_current_request_logs({"pending_file_id": result.pending_file_id})

    return response.ApiResponse(
        message="Success",
        data={
            "url": result.url,
            "body": result.body,
            "pending_file_id": result.pending_file_id,
        },
    )


@file_blueprint.post("/<uuid:pending_file_id>")
@file_blueprint.input(file_schemas.FileScanStatusUpdateRequestSchema, location="json")
@file_blueprint.output(file_schemas.FileScanStatusUpdateResponseSchema)
@file_blueprint.doc(hide=True)
@file_blueprint.auth_required(api_user_key_auth)
@flask_db.with_db_session()
def update_file_scan_status(
    db_session: db.Session, pending_file_id: uuid.UUID, json_data: dict
) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"pending_file_id": pending_file_id})
    logger.info("POST /v1/files/<pending_file_id>")

    with db_session.begin():
        user = api_user_key_auth.get_user()
        db_session.add(user)

        update_pending_file_scan_status(
            db_session, pending_file_id, json_data["file_scan_status"], user
        )

    return response.ApiResponse(message="Success")


@file_blueprint.get("/<uuid:pending_file_id>/results")
@file_blueprint.output(file_schemas.FileScanResultsResponseSchema)
@file_blueprint.doc(
    summary="Stream file scan results",
    description=(
        "Stream the scan status of a pending file as newline-delimited JSON. "
        "Each chunk matches the documented response schema. The endpoint polls "
        "DynamoDB on a configurable interval and ends the stream when the scan "
        "reaches a terminal status (complete/infected) or the configured max "
        "duration elapses."
    ),
    responses=[200, 401, 403, 404],
)
@file_blueprint.auth_required(jwt_or_api_user_key_multi_auth)
def get_file_scan_results(pending_file_id: uuid.UUID) -> Response:
    user = jwt_or_api_user_key_multi_auth.get_user()
    add_extra_data_to_current_request_logs(
        {"pending_file_id": pending_file_id, "user_id": user.user_id}
    )
    logger.info("GET /v1/files/<pending_file_id>/results")

    chunks = stream_file_scan_results(
        pending_file_id=pending_file_id,
        user=user,
        dynamodb_client=DynamoDBClient(),
    )
    response_schema = file_schemas.FileScanResultsResponseSchema()

    def serialize() -> Iterator[str]:
        for chunk in chunks:
            yield response_schema.dumps(chunk) + "\n"

    return Response(stream_with_context(serialize()), mimetype="application/x-ndjson")
