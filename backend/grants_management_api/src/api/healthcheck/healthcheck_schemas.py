from grants_shared.api.schemas.extension import Schema, fields
from grants_shared.api.schemas.response_schema import AbstractResponseSchema

class HealthcheckMetadataSchema(Schema):
    commit_sha = fields.String(
        metadata={
            "description": "The github commit sha for the latest deployed commit",
            "example": "ffaca647223e0b6e54344122eefa73401f5ec131",
        }
    )
    commit_link = fields.String(
        metadata={
            "description": "A github link to the latest deployed commit",
            "example": "https://github.com/HHS/simpler-grants-gov/commit/main",
        }
    )

    release_notes_link = fields.String(
        metadata={
            "description": "A github link to the release notes - direct if the latest deploy was a release",
            "example": "https://github.com/HHS/simpler-grants-gov/releases",
        }
    )

    last_deploy_time = fields.DateTime(
        metadata={"description": "Latest deploy time in US/Eastern timezone"}
    )

    deploy_whoami = fields.String(
        metadata={"description": "The latest user to deploy the application", "example": "runner"}
    )

class HealthcheckResponseSchema(AbstractResponseSchema):
    data = fields.Nested(HealthcheckMetadataSchema())