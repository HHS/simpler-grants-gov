from pydantic import BaseModel


class SOAPRequest(BaseModel):
    data: bytes
    full_path: str
    headers: dict
    method: str


class SOAPProxyResponse(BaseModel):
    data: bytes
    status_code: int
    headers: dict

    def to_flask_response(self) -> tuple:
        return self.data, self.status_code, self.headers
