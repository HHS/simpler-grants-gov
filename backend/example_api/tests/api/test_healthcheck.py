import apiflask
import grants_shared

def test_thing():
    print(grants_shared.util.datetime_util.utcnow())
    print(grants_shared.util.other_util)
    print("Hello - I'm a function")