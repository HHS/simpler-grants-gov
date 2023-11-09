"""
There are several ways errors can be thrown by the API

These tests aim to verify that the format and structure of the error
responses is consistent and functioning as intended.
"""

import dataclasses

import pytest
from apiflask import APIBlueprint
from werkzeug.exceptions import BadRequest, Forbidden, NotFound, Unauthorized
from werkzeug.http import HTTP_STATUS_CODES

import src.app as app_entry
import src.logging
from src.auth.api_key_auth import api_key_auth
from src.api.response import ValidationErrorDetail
from src.api.utils.route_utils import raise_flask_error
from api.route.schemas.extension import Schema, fields
from api.util.dict_utils import flatten_dict
from tests.api.route.schemas.schema_validation_utils import (
    FieldTestSchema,
    get_expected_validation_errors,
    get_invalid_field_test_schema_req,
    get_valid_field_test_schema_req,
)

PATH = "/test/"
VALID_UUID = "1234a5b6-7c8d-90ef-1ab2-c3d45678e9f0"
FULL_PATH = PATH + VALID_UUID


def header(valid_jwt_token):
    return {"X-NJ-UI-User": "nava-test", "X-NJ-UI-Key": valid_jwt_token}


class OutputSchema(Schema):
    output_val = fields.String()


test_blueprint = APIBlueprint("test", __name__, tag="test")


class OverridenClass:
    """
    In order to arbitrarily change the implementation of
    the test endpoint, create a simple function that tests
    below can override by doing::

        def override(self):
            # if this method returns, it returns
            # the response as a dictionary + a list
            # of validation issues to attach to the response
            return {"output_val": "hello"}, []

        monkeypatch.setattr(OverridenClass, "override_method", override)
    """

    def override_method(self):
        return {"output_val": "hello"}, []


@test_blueprint.patch("/test/<uuid:test_id>")
@test_blueprint.input(FieldTestSchema)
@test_blueprint.output(OutputSchema)
@test_blueprint.auth_required(api_token_auth)
def api_method(id, req):
    resp, warnings = OverridenClass().override_method()
    return response.ApiResponse("Test method run successfully", data=resp, warnings=warnings)


@pytest.fixture
def simple_app(monkeypatch):
    def stub(app):
        pass

    # We want all the configurational setup for the app, but
    # don't want the DB clients or blueprints to keep setup simpler
    monkeypatch.setattr(app_entry, "register_db_clients", stub)
    monkeypatch.setattr(app_entry, "register_blueprints", stub)
    monkeypatch.setattr(app_entry, "setup_logging", stub)

    app = app_entry.create_app()

    # To avoid re-initializing logging everytime we
    # setup the app, we disabled it above and do it here
    # in case you want it while running your tests
    with api.logging.init(__package__):
        yield app


@pytest.fixture
def simple_client(simple_app):
    simple_app.register_blueprint(test_blueprint)
    return simple_app.test_client()


@pytest.mark.parametrize(
    "exception", [Exception, AttributeError, IndexError, NotImplementedError, ValueError]
)
def test_exception(simple_client, valid_jwt_token, monkeypatch, exception):
    def override(self):
        raise exception("Exception message text")

    monkeypatch.setattr(OverridenClass, "override_method", override)

    resp = simple_client.patch(
        FULL_PATH, json=get_valid_field_test_schema_req(), headers=header(valid_jwt_token)
    )

    assert resp.status_code == 500
    resp_json = resp.get_json()
    assert resp_json["data"] == {}
    assert resp_json["errors"] == []
    assert resp_json["message"] == "Internal Server Error"


@pytest.mark.parametrize("exception", [Unauthorized, NotFound, Forbidden, BadRequest])
def test_werkzeug_exceptions(simple_client, valid_jwt_token, monkeypatch, exception):
    def override(self):
        raise exception("Exception message text")

    monkeypatch.setattr(OverridenClass, "override_method", override)

    resp = simple_client.patch(
        FULL_PATH, json=get_valid_field_test_schema_req(), headers=header(valid_jwt_token)
    )

    # Werkzeug errors use the proper status code, but
    # any message is replaced with a generic one they have defined
    assert resp.status_code == exception.code
    resp_json = resp.get_json()
    assert resp_json["data"] == {}
    assert resp_json["errors"] == []
    assert resp_json["message"] == HTTP_STATUS_CODES[exception.code]


@pytest.mark.parametrize(
    "error_code,message,detail,validation_issues",
    [
        (422, "message", {"field": "value"}, []),
        (
            422,
            "message but different",
            None,
            [
                ValidationErrorDetail(
                    type="example", message="example message", field="example_field", value="value"
                ),
                ValidationErrorDetail(
                    type="example2", message="example message2", field="example_field2", value=4
                ),
            ],
        ),
        (401, "not allowed", {"field": "value"}, []),
        (403, "bad request message", None, []),
    ],
)
def test_flask_error(
    simple_client, valid_jwt_token, monkeypatch, error_code, message, detail, validation_issues
):
    def override(self):
        raise_flask_error(error_code, message, detail=detail, validation_issues=validation_issues)

    monkeypatch.setattr(OverridenClass, "override_method", override)

    resp = simple_client.patch(
        FULL_PATH, json=get_valid_field_test_schema_req(), headers=header(valid_jwt_token)
    )

    assert resp.status_code == error_code
    resp_json = resp.get_json()
    assert resp_json["message"] == message

    if detail is None:
        assert resp_json["data"] == {}
    else:
        assert resp_json["data"] == detail

    if validation_issues:
        errors = resp_json["errors"]
        assert len(validation_issues) == len(errors)

        for validation_issue in validation_issues:
            assert dataclasses.asdict(validation_issue) in errors
    else:
        assert resp_json["errors"] == []


def test_invalid_path_param(simple_client, valid_jwt_token, monkeypatch):
    resp = simple_client.patch(
        PATH + "not-a-uuid", json=get_valid_field_test_schema_req(), headers=header(valid_jwt_token)
    )

    # This raises a Werkzeug NotFound so has those values
    assert resp.status_code == 404
    resp_json = resp.get_json()
    assert resp_json["data"] == {}
    assert resp_json["errors"] == []
    assert resp_json["message"] == "Not Found"


def test_auth_error(simple_client, monkeypatch):
    resp = simple_client.patch(
        FULL_PATH, json=get_valid_field_test_schema_req(), headers=header("not_valid_jwt")
    )

    assert resp.status_code == 401
    resp_json = resp.get_json()
    assert resp_json["data"] == {}
    assert resp_json["errors"] == []
    assert resp_json["message"] == "There was an error verifying token"


@pytest.mark.parametrize(
    "issues",
    [
        [],
        [
            ValidationErrorDetail(
                type="required", message="Field is required", field="sub_obj.field_a"
            ),
            ValidationErrorDetail(
                type="format", message="Invalid format for type string", field="field_b"
            ),
        ],
        [ValidationErrorDetail(type="bad", message="field is optional technically")],
    ],
)
def test_added_validation_issues(simple_client, valid_jwt_token, monkeypatch, issues):
    def override(self):
        return {"output_val": "hello with validation issues"}, issues

    monkeypatch.setattr(OverridenClass, "override_method", override)

    resp = simple_client.patch(
        FULL_PATH, json=get_valid_field_test_schema_req(), headers=header(valid_jwt_token)
    )

    assert resp.status_code == 200
    resp_json = resp.get_json()
    assert resp_json["data"] == {"output_val": "hello with validation issues"}
    assert resp_json["message"] == "Test method run successfully"

    warnings = resp_json["warnings"]

    assert len(issues) == len(warnings)
    for issue in issues:
        assert dataclasses.asdict(issue) in warnings


def test_marshmallow_validation(simple_client, valid_jwt_token, monkeypatch):
    """
    Validate that Marshmallow errors get transformed properly
    and attached in the expected format in an error response
    """

    req = get_invalid_field_test_schema_req()
    resp = simple_client.patch(FULL_PATH, json=req, headers=header(valid_jwt_token))

    assert resp.status_code == 422
    resp_json = resp.get_json()
    assert resp_json["data"] == {}
    assert resp_json["message"] == "Validation error"

    resp_errors = resp_json["errors"]

    expected_errors = []
    for field, errors in flatten_dict(get_expected_validation_errors()).items():
        for error in errors:
            expected_errors.append(
                {
                    "type": error.key,
                    "message": error.message,
                    "field": field.removesuffix("._schema"),
                    "value": None,
                }
            )

    assert len(expected_errors) == len(resp_errors)
    for expected_error in expected_errors:
        assert expected_error in resp_errors
