from collections.abc import Iterator

from pydantic import BaseModel, ConfigDict


class SOAPResponse(BaseModel):
    data: bytes | Iterator[bytes] | list[bytes]
    status_code: int
    headers: dict
    _cached_bytes: bytes | None = None

    model_config = ConfigDict(arbitrary_types_allowed=True)

    def to_flask_response(self) -> tuple:
        response_data = self.data if isinstance(self.data, bytes) else self.stream()
        return response_data, self.status_code, self.headers

    def to_bytes(self) -> bytes:
        if isinstance(self.data, bytes):
            return self.data
        if self._cached_bytes is None:
            self._cached_bytes = b"".join(iter(self.data))
        return self._cached_bytes

    def stream(self) -> Iterator[bytes] | list[bytes]:

        def _data_generator(data: bytes) -> Iterator[bytes]:
            data_length = len(data)
            for i in range(0, data_length, 4000):
                yield data[i : i + 4000]

        if self._cached_bytes:
            return _data_generator(self._cached_bytes)
        if isinstance(self.data, bytes):
            return _data_generator(self.data)
        return self.data
