import json
from pathlib import Path

import pytest

from bandera.benchmark import benchmark
from bandera.rollout import decide
from bandera.simulation import generate_scores

FIXTURES = Path(__file__).parent / "fixtures"


def _load(name: str):
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def test_lcg_is_deterministic():
    assert generate_scores(42, 0.72, 0.12, 24) == generate_scores(42, 0.72, 0.12, 24)


def test_decide_thresholds():
    assert decide(-0.09, -0.05, 0.02) == "kill"
    assert decide(0.05, 0.1, 0.02) == "advance"
    assert decide(-0.04, 0.0, 0.02) == "hold"


def test_rollout_matches_fixture():
    cfg = _load("flag.json")
    fixture = _load("rollout.json")

    results = benchmark(cfg)
    for expected in fixture["experiments"]:
        got = next(r for r in results if r["id"] == expected["id"])
        assert got["completed"] == expected["completed"]
        assert got["killed"] == expected["killed"]
        assert got["killedAt"] == expected["killedAt"]
        assert got["regressions"] == expected["regressions"]
        assert got["finalTraffic"] == pytest.approx(expected["finalTraffic"], abs=1e-10)
        assert [s["decision"] for s in got["stages"]] == expected["decisions"]

        for gs, es in zip(got["stages"], expected["stages"]):
            assert gs["stage"] == pytest.approx(es["stage"], abs=1e-10)
            assert gs["delta"] == pytest.approx(es["delta"], abs=1e-10)
            assert gs["pValue"] == pytest.approx(es["pValue"], abs=1e-10)
            assert gs["ciLow"] == pytest.approx(es["ciLow"], abs=1e-10)
            assert gs["ciHigh"] == pytest.approx(es["ciHigh"], abs=1e-10)


def test_good_completes_bad_kills():
    cfg = _load("flag.json")
    results = benchmark(cfg)
    good = next(r for r in results if r["id"] == "smart-routing")
    bad = next(r for r in results if r["id"] == "smart-routing-bad")

    assert good["completed"] and good["regressions"] == 0 and good["finalTraffic"] == 1.0
    assert bad["killed"] and bad["regressions"] == 1 and bad["finalTraffic"] == 0.0


def test_per_user_outcomes_match_fixture():
    from bandera.rollout import simulate_rollout
    cfg = _load("flag.json")
    fixture = _load("rollout.json")
    results = benchmark(cfg)
    for expected in fixture["experiments"]:
        got = next(r for r in results if r["id"] == expected["id"])
        assert [s["outcomes"] for s in got["stages"]] == [s["outcomes"] for s in expected["stages"]]
    story = fixture["story"]
    r = simulate_rollout({**cfg, "margin": story["margin"]}, {"id": "story", "name": "story", "variantMean": story["variantMean"], "seed": story["seed"]})
    assert [s["outcomes"] for s in r["stages"]] == story["outcomes"]
