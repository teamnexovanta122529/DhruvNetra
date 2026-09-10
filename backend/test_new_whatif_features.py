import unittest
import sys
from pathlib import Path
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

class TestNewWhatIfFeatures(unittest.TestCase):
    def test_water_scenario(self):
        resp = client.post("/api/what-if", json={
            "query": "What if water purification plant fails for 24 hours?",
            "station": "Maitri"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["response_type"], "SCENARIO_ANALYSIS")
        self.assertIsNotNone(data.get("health"))
        self.assertGreaterEqual(len(data.get("cascading_effects", [])), 1)
        self.assertGreaterEqual(len(data.get("mitigation_strategies", [])), 1)

    def test_logistics_scenario(self):
        resp = client.post("/api/what-if", json={
            "query": "What if fuel delivery is delayed by 7 days?",
            "station": "Maitri"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertIsNotNone(data.get("health"))

    def test_compare_endpoint(self):
        resp = client.post("/api/what-if/compare", json={
            "station": "Maitri",
            "scenario_a": {"query": "What if generator 1 is off for 4 hours?"},
            "scenario_b": {"query": "What if generator 1 and generator 2 are off for 4 hours?"}
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertIn("comparison", data)
        self.assertEqual(data["comparison"]["preferred_scenario"], "Scenario A")
        self.assertIn("deltas", data["comparison"])
        self.assertIn("power_deficit_kw", data["comparison"]["deltas"])

if __name__ == "__main__":
    unittest.main()
