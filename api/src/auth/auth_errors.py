class JwtValidationError(Exception):
    """
    Exception we will reraise if there are
    any issues processing a JWT that should
    cause the endpoint to raise a 401
    """

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message
