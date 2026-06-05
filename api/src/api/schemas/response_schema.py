from grants_shared.api.schemas.extension import Schema, fields

from src.pagination.pagination_schema import PaginationInfoSchema


class PaginationMixinSchema(Schema):
    pagination_info = fields.Nested(
        PaginationInfoSchema(),
        metadata={"description": "The pagination information for paginated endpoints"},
    )
