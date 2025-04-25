

from flask_httpauth import MultiAuth
from apiflask.security import _AuthBase

from .api_key_auth import api_key_auth
from .api_jwt_auth import api_jwt_auth

class ApiFlaskMultiAuth(_AuthBase, MultiAuth):
    # TODO - is there a way to make multiauth work with
    # APIFlask's additional auth stuff?
    pass

multi_auth = MultiAuth(api_jwt_auth, api_key_auth)
