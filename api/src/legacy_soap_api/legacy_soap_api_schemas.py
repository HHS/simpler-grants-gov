from pydantic import BaseModel


class LegacySOAPResponse(BaseModel):
    data: bytes
    status_code: int
    headers: dict

    def to_flask_response(self) -> tuple:
        return self.data, self.status_code, self.headers
