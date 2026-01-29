from check import check
from manage import manage


def lambda_handler(event, context):
    action = event["action"]
    assert action in ("check", "manage")
    if action == "check":
        return check(event["config"])
    elif action == "manage":
        return manage(event["config"])
