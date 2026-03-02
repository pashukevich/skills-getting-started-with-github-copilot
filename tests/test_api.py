import copy

import pytest
from fastapi.testclient import TestClient

from src import app as _app_module

# reuse the application instance
client = TestClient(_app_module.app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Make a deep copy of the activities dict and restore after test."""
    orig = copy.deepcopy(_app_module.activities)
    yield
    _app_module.activities.clear()
    _app_module.activities.update(orig)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Basketball" in data


def test_signup_success():
    email = "teststudent@mergington.edu"
    resp = client.post(f"/activities/Basketball/signup?email={email}")
    assert resp.status_code == 200
    assert email in _app_module.activities["Basketball"]["participants"]
    assert "Signed up" in resp.json()["message"]


def test_signup_duplicate():
    email = "james@mergington.edu"
    resp = client.post(f"/activities/Basketball/signup?email={email}")
    assert resp.status_code == 400
    assert "already signed up" in resp.json()["detail"].lower()


def test_signup_unknown_activity():
    resp = client.post("/activities/NoSuchActivity/signup?email=foo@bar.com")
    assert resp.status_code == 404


def test_unregister_success():
    email = "alex@mergington.edu"
    resp = client.delete(f"/activities/Tennis%20Club/participants/{email}")
    assert resp.status_code == 200
    assert email not in _app_module.activities["Tennis Club"]["participants"]


def test_unregister_not_registered():
    resp = client.delete(
        "/activities/Drama%20Club/participants/nonexistent@mergington.edu"
    )
    assert resp.status_code == 404


def test_unregister_unknown_activity():
    resp = client.delete("/activities/NoSuch/participants/foo@bar.com")
    assert resp.status_code == 404
