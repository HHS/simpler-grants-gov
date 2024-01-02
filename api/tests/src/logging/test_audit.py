#
# Tests for src.logging.audit.
#

import logging
import os
import pathlib
import signal
import socket
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Callable

import pytest

import src.logging.audit as audit

# Do not run these tests alongside the rest of the test suite since
# this tests adds an audit hook that interfere with other tests,
# and at the time of writing there isn't a known way to remove
# audit hooks.
pytestmark = pytest.mark.audit


@pytest.fixture(scope="session")
def init_audit_hook():
    audit.init()


test_audit_hook_data = [
    pytest.param(eval, ("1+1", None, None), [{"msg": "exec"}], id="eval"),
    pytest.param(exec, ("1+1", None, None), [{"msg": "exec"}], id="exec"),
    pytest.param(
        open,
        ("/dev/null", "w"),
        [
            {
                "msg": "open",
                "audit.args.path": "/dev/null",
                "audit.args.mode": "w",
            }
        ],
        id="open",
    ),
    pytest.param(
        os.rename,
        ("/tmp/oldname", "/tmp/newname"),
        [
            {
                "msg": "os.rename",
                "audit.args.src": "/tmp/oldname",
                "audit.args.dst": "/tmp/newname",
            }
        ],
        id="os.rename",
    ),
    pytest.param(
        subprocess.Popen,
        (["/usr/bin/git", "log", "HEAD~1..HEAD"],),
        [
            {
                "msg": "subprocess.Popen",
                "audit.args.executable": "/usr/bin/git",
                "audit.args.args": ["/usr/bin/git", "log", "HEAD~1..HEAD"],
            }
        ],
        id="subprocess.Popen",
    ),
    pytest.param(
        os.open,
        ("/dev/null", os.O_RDWR | os.O_CREAT, 0o777),
        [
            {
                "msg": "open",
                "audit.args.path": "/dev/null",
                "audit.args.mode": None,
            }
        ],
        id="os.open",
    ),
    pytest.param(
        sys.addaudithook,
        (lambda *args: None,),
        [{"msg": "sys.addaudithook"}],
        id="sys.addaudithook",
    ),
    pytest.param(
        socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect,
        (("www.python.org", 80),),
        [{"msg": "socket.connect", "audit.args.address": ("www.python.org", 80)}],
        id="socket.connect",
    ),
    pytest.param(
        socket.getaddrinfo,
        ("www.python.org", 80),
        [{"msg": "socket.getaddrinfo", "audit.args.host": "www.python.org", "audit.args.port": 80}],
        id="socket.getaddrinfo",
    ),
    pytest.param(
        urllib.request.urlopen,
        ("https://www.python.org",),
        # urllib.request.urlopen calls socket.getaddrinfo and socket.connect under the hood,
        # both of which trigger audit log entries
        [
            {
                "msg": "urllib.Request",
                "audit.args.url": "https://www.python.org",
                "audit.args.method": "GET",
            },
            {
                "msg": "socket.getaddrinfo",
                "audit.args.host": "www.python.org",
                "audit.args.port": 443,
            },
            {
                "msg": "socket.connect",
            },
        ],
        id="urllib.request.urlopen",
    ),
]


@pytest.mark.parametrize("func,args,expected_records", test_audit_hook_data)
def test_audit_hook(
    init_audit_hook,
    caplog: pytest.LogCaptureFixture,
    func: Callable,
    args: tuple[Any],
    expected_records: list[dict[str, Any]],
):
    caplog.set_level(logging.INFO)
    caplog.clear()

    try:
        func(*args)
    except Exception:
        pass

    assert len(caplog.records) == len(expected_records)
    for record, expected_record in zip(caplog.records, expected_records, strict=True):
        assert record.levelname == "AUDIT"
        assert_record_match(record, expected_record)


def test_os_kill(init_audit_hook, caplog: pytest.LogCaptureFixture):
    # Start a process to kill
    process = subprocess.Popen("cat")
    os.kill(process.pid, signal.SIGTERM)

    expected_records = [
        {"msg": "subprocess.Popen"},
        {
            "msg": "os.kill",
            "audit.args.pid": process.pid,
            "audit.args.sig": signal.SIGTERM,
        },
    ]

    assert len(caplog.records) == len(expected_records)
    for record, expected_record in zip(caplog.records, expected_records, strict=True):
        assert record.levelname == "AUDIT"
        assert_record_match(record, expected_record)


def test_do_not_log_popen_env(
    init_audit_hook, caplog: pytest.LogCaptureFixture, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setenv("FOO", "SENSITIVE-DATA")
    subprocess.Popen(["ls"], env=os.environ)
    for record in caplog.records:
        assert "SENSITIVE-DATA" not in str(record.__dict__)


def test_do_not_log_request_data(
    init_audit_hook,
    caplog: pytest.LogCaptureFixture,
):
    data = urllib.parse.urlencode({"foo": "SENSITIVE-DATA"}).encode()
    req = urllib.request.Request("https://www.python.org", data=data)
    req.add_header("X-Bar", "SENSITIVE-DATA")
    try:
        urllib.request.urlopen(req)
    except urllib.error.HTTPError:
        pass

    for record in caplog.records:
        assert "SENSITIVE-DATA" not in str(record.__dict__)


def test_repeated_audit_logs(
    init_audit_hook, caplog: pytest.LogCaptureFixture, tmp_path: pathlib.Path
):
    caplog.set_level(logging.INFO)
    caplog.clear()

    for _ in range(1000):
        open(tmp_path / "repeated-audit-logs", "w")

    expected_records = [
        {"msg": "open", "count": 1},
        {"msg": "open", "count": 2},
        {"msg": "open", "count": 3},
        {"msg": "open", "count": 4},
        {"msg": "open", "count": 5},
        {"msg": "open", "count": 6},
        {"msg": "open", "count": 7},
        {"msg": "open", "count": 8},
        {"msg": "open", "count": 9},
        {"msg": "open", "count": 10},
        {"msg": "open", "count": 20},
        {"msg": "open", "count": 30},
        {"msg": "open", "count": 40},
        {"msg": "open", "count": 50},
        {"msg": "open", "count": 60},
        {"msg": "open", "count": 70},
        {"msg": "open", "count": 80},
        {"msg": "open", "count": 90},
        {"msg": "open", "count": 100},
        {"msg": "open", "count": 200},
        {"msg": "open", "count": 300},
        {"msg": "open", "count": 400},
        {"msg": "open", "count": 500},
        {"msg": "open", "count": 600},
        {"msg": "open", "count": 700},
        {"msg": "open", "count": 800},
        {"msg": "open", "count": 900},
        {"msg": "open", "count": 1000},
    ]

    assert len(caplog.records) == len(expected_records)
    for record, expected_record in zip(caplog.records, expected_records, strict=True):
        assert record.levelname == "AUDIT"
        assert_record_match(record, expected_record)


# Test utility data structure used by audit module
def test_least_recently_used_dict():
    lru_dict = audit.LeastRecentlyUsedDict(maxsize=4)

    assert lru_dict["a"] == 0
    assert len(lru_dict) == 0

    lru_dict["a"] = 10
    lru_dict["b"] = 20
    lru_dict["c"] = 30
    lru_dict["d"] = 40

    assert len(lru_dict) == 4
    assert tuple(lru_dict.items()) == (("a", 10), ("b", 20), ("c", 30), ("d", 40))
    assert lru_dict["a"] == 10
    assert lru_dict["b"] == 20
    assert lru_dict["c"] == 30
    assert lru_dict["d"] == 40
    assert lru_dict["e"] == 0
    assert len(lru_dict) == 4

    lru_dict["a"] += 1  # Write existing a, move to end
    assert len(lru_dict) == 4
    assert tuple(lru_dict.items()) == (("b", 20), ("c", 30), ("d", 40), ("a", 11))

    lru_dict["f"] = 50  # Write new key f, and evict oldest b
    lru_dict["c"] += 1  # Write existing c, move to end, and evict oldest d
    lru_dict["g"] = 60  # Write new key g, and evict oldest d
    assert len(lru_dict) == 4
    assert tuple(lru_dict.items()) == (("a", 11), ("f", 50), ("c", 31), ("g", 60))


def assert_record_match(record: logging.LogRecord, expected_record: dict[str, Any]):
    for key, value in expected_record.items():
        assert record.__dict__[key] == value
