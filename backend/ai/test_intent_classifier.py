"""
DHRUVNETRA AI - Automated Intent Classification & Telemetry Grounding Tests
SIH 2026: Antarctic Digital Twin Platform (Maitri & Bharati)
"""

import unittest
from backend.ai.intent.intent_classifier import (
    QueryIntentClassifier,
    IntentType,
)
from backend.ai.telemetry.telemetry_resolver import (
    TelemetryResolver,
    CANONICAL_STATION_TELEMETRY,
)


class TestIntentClassificationAndTelemetry(unittest.TestCase):
    def setUp(self):
        self.classifier = QueryIntentClassifier()
        self.resolver = TelemetryResolver()

    # -------------------------------------------------------------------------
    # 1. Simple Telemetry Queries (MUST NOT trigger What-If)
    # -------------------------------------------------------------------------
    def test_fuel_level_g1(self):
        res = self.classifier.classify("What is the fuel level of Generator 1?", default_station="Maitri")
        self.assertEqual(res.intent, IntentType.SIMPLE_TELEMETRY_QUERY)
        self.assertFalse(res.requires_simulation)
        self.assertEqual(res.entities.component_id, "G1")
        self.assertEqual(res.entities.metric, "fuel_level")

        ans = self.resolver.resolve(res.intent, res.entities)
        self.assertIn("68%", ans.text)
        self.assertIn("Generator 1", ans.text)
        self.assertNotIn("DHRUVNETRA AI OPERATIONAL ASSESSMENT", ans.text)
        self.assertNotIn("Calculated Risk", ans.text)

    def test_fuel_amount_g1(self):
        res = self.classifier.classify("How much fuel does G1 have?", default_station="Maitri")
        self.assertEqual(res.intent, IntentType.SIMPLE_TELEMETRY_QUERY)
        self.assertFalse(res.requires_simulation)
        self.assertEqual(res.entities.component_id, "G1")
        self.assertEqual(res.entities.metric, "fuel_level")

        ans = self.resolver.resolve(res.intent, res.entities)
        self.assertIn("68%", ans.text)

    def test_is_g1_running(self):
        res = self.classifier.classify("Is G1 running?", default_station="Maitri")
        self.assertEqual(res.intent, IntentType.SIMPLE_TELEMETRY_QUERY)
        self.assertFalse(res.requires_simulation)
        self.assertEqual(res.entities.component_id, "G1")
        self.assertEqual(res.entities.metric, "generator_status")

        ans = self.resolver.resolve(res.intent, res.entities)
        self.assertIn("RUNNING", ans.text)

    def test_power_output_g1(self):
        res = self.classifier.classify("What is G1 producing right now?", default_station="Maitri")
        self.assertEqual(res.intent, IntentType.SIMPLE_TELEMETRY_QUERY)
        self.assertFalse(res.requires_simulation)
        self.assertEqual(res.entities.component_id, "G1")
        self.assertEqual(res.entities.metric, "power_output")

        ans = self.resolver.resolve(res.intent, res.entities)
        self.assertIn("125", ans.text)
        self.assertIn("kW", ans.text)

    def test_temperature_maitri(self):
        res = self.classifier.classify("What is the current temperature at Maitri?", default_station="Maitri")
        self.assertEqual(res.intent, IntentType.ENVIRONMENT_QUERY)
        self.assertFalse(res.requires_simulation)

        ans = self.resolver.resolve(res.intent, res.entities)
        self.assertIn("-24.3", ans.text)
        self.assertNotIn("Calculated Risk", ans.text)

    def test_wind_speed(self):
        res = self.classifier.classify("What is the wind speed?", default_station="Maitri")
        self.assertEqual(res.intent, IntentType.ENVIRONMENT_QUERY)
        self.assertFalse(res.requires_simulation)

        ans = self.resolver.resolve(res.intent, res.entities)
        self.assertIn("34", ans.text)

    def test_critical_alerts(self):
        res = self.classifier.classify("Are there any critical alerts?", default_station="Maitri")
        self.assertEqual(res.intent, IntentType.ALERT_QUERY)
        self.assertFalse(res.requires_simulation)

        ans = self.resolver.resolve(res.intent, res.entities)
        self.assertIn("0", ans.text)

    # -------------------------------------------------------------------------
    # 2. Explicit What-If Queries (MUST trigger What-If)
    # -------------------------------------------------------------------------
    def test_what_if_g1_shutdown(self):
        res = self.classifier.classify("What if generator 1 shuts down for 7 hours?", default_station="Maitri")
        self.assertEqual(res.intent, IntentType.WHAT_IF_SCENARIO)
        self.assertTrue(res.requires_simulation)
        self.assertTrue(res.is_hypothetical)
        self.assertEqual(res.entities.component_id, "G1")
        self.assertEqual(res.entities.action, "shutdown")
        self.assertEqual(res.entities.duration_hours, 7.0)

    def test_what_happens_if_g2_fails(self):
        res = self.classifier.classify("What happens if G2 fails?", default_station="Maitri")
        self.assertEqual(res.intent, IntentType.WHAT_IF_SCENARIO)
        self.assertTrue(res.requires_simulation)
        self.assertEqual(res.entities.component_id, "G2")
        self.assertEqual(res.entities.action, "fail")

    def test_battery_affected_if_g1_fails(self):
        res = self.classifier.classify("How will the battery reserve be affected if G1 fails?", default_station="Maitri")
        self.assertEqual(res.intent, IntentType.WHAT_IF_SCENARIO)
        self.assertTrue(res.requires_simulation)

    # -------------------------------------------------------------------------
    # 3. Context Boundaries & Zero Scenario Leakage
    # -------------------------------------------------------------------------
    def test_sequence_scenario_then_factual(self):
        # Step 1: User asks What-If
        q1 = "What if Generator 1 shuts down for 7 hours?"
        res1 = self.classifier.classify(q1, default_station="Maitri")
        self.assertEqual(res1.intent, IntentType.WHAT_IF_SCENARIO)
        active_scenario = {"id": "sim-1", "action": "shutdown", "duration": 7.0, "component": "G1"}

        # Step 2: User asks factual fuel level of G1
        # MUST NOT continue scenario
        q2 = "What is the fuel level of Generator 1?"
        res2 = self.classifier.classify(q2, default_station="Maitri", active_scenario=active_scenario)
        self.assertEqual(res2.intent, IntentType.SIMPLE_TELEMETRY_QUERY)
        self.assertFalse(res2.requires_simulation)
        self.assertFalse(res2.entities.is_scenario_follow_up)

        ans2 = self.resolver.resolve(res2.intent, res2.entities)
        self.assertIn("68%", ans2.text)
        self.assertNotIn("shutdown", ans2.text.lower())
        self.assertNotIn("operational assessment", ans2.text.lower())

        # Step 3: User asks "Is it running?"
        q3 = "Is it running?"
        res3 = self.classifier.classify(q3, default_station="Maitri", previous_intent="SIMPLE_TELEMETRY_QUERY", previous_query=q2)
        self.assertEqual(res3.intent, IntentType.SIMPLE_TELEMETRY_QUERY)
        ans3 = self.resolver.resolve(res3.intent, res3.entities)
        self.assertIn("RUNNING", ans3.text)

        # Step 4: User asks "What happens if it shuts down?"
        q4 = "What happens if it shuts down?"
        res4 = self.classifier.classify(q4, default_station="Maitri")
        self.assertEqual(res4.intent, IntentType.WHAT_IF_SCENARIO)
        self.assertTrue(res4.requires_simulation)

        # Step 5: User asks "What is the current temperature?"
        q5 = "What is the current temperature?"
        res5 = self.classifier.classify(q5, default_station="Maitri", active_scenario=active_scenario)
        self.assertEqual(res5.intent, IntentType.ENVIRONMENT_QUERY)
        self.assertFalse(res5.requires_simulation)

        ans5 = self.resolver.resolve(res5.intent, res5.entities)
        self.assertIn("-24.3", ans5.text)
        self.assertNotIn("shutdown", ans5.text.lower())

    # -------------------------------------------------------------------------
    # 4. Station Override Context
    # -------------------------------------------------------------------------
    def test_station_override(self):
        # Default is Maitri, but query mentions Bharati
        res = self.classifier.classify("What is the fuel level of G1 at Bharati?", default_station="Maitri")
        self.assertEqual(res.entities.station, "Bharati")
        ans = self.resolver.resolve(res.intent, res.entities)
        self.assertIn("Bharati", ans.text)
        self.assertIn("76%", ans.text)  # Bharati G1 has 76%

    # -------------------------------------------------------------------------
    # 5. Follow-ups & Ambiguity Handling
    # -------------------------------------------------------------------------
    def test_litres_follow_up(self):
        # User previously asked about G1 fuel level
        q1 = "What is G1 fuel level?"
        res1 = self.classifier.classify(q1, default_station="Maitri")
        self.assertEqual(res1.intent, IntentType.SIMPLE_TELEMETRY_QUERY)

        # Follow-up: "How much is that in litres?"
        q2 = "How much is that in litres?"
        res2 = self.classifier.classify(q2, default_station="Maitri", previous_query=q1, previous_intent=res1.intent.value)
        self.assertEqual(res2.intent, IntentType.SIMPLE_TELEMETRY_QUERY)
        self.assertTrue(res2.entities.is_telemetry_follow_up)
        self.assertEqual(res2.entities.component_id, "G1")

        ans2 = self.resolver.resolve(res2.intent, res2.entities)
        self.assertIn("1,360", ans2.text)

    # -------------------------------------------------------------------------
    # 6. Multi-Generator Scenario Tests
    # -------------------------------------------------------------------------
    def test_multi_generator_turn_off(self):
        # The primary user query that failed previously
        query = "What if I turned the generator 1 and 2 off?"
        res = self.classifier.classify(query, default_station="Maitri")
        self.assertEqual(res.intent, IntentType.WHAT_IF_SCENARIO)
        self.assertTrue(res.requires_simulation)
        self.assertTrue(res.is_hypothetical)
        self.assertEqual(res.entities.affected_generators, ["G1", "G2"])
        self.assertEqual(res.entities.action, "shutdown")
        self.assertEqual(res.entities.duration_hours, 1.0)
        self.assertTrue(res.entities.duration_is_default)

    def test_multi_generator_three_units(self):
        query = "What if generators 1, 2 and 3 fail for 3 hours?"
        res = self.classifier.classify(query, default_station="Maitri")
        self.assertEqual(res.intent, IntentType.WHAT_IF_SCENARIO)
        self.assertEqual(res.entities.affected_generators, ["G1", "G2", "G3"])
        self.assertEqual(res.entities.duration_hours, 3.0)
        self.assertFalse(res.entities.duration_is_default)

    def test_fuel_level_till_now(self):
        query = "What is the fuel level till now?"
        res = self.classifier.classify(query, default_station="Maitri")
        self.assertEqual(res.intent, IntentType.SIMPLE_TELEMETRY_QUERY)
        self.assertFalse(res.requires_simulation)
        ans = self.resolver.resolve(res.intent, res.entities)
        self.assertIn("68", ans.text)
        self.assertIn("81,600", ans.text)

    def test_condition_of_generator_1(self):
        query = "What is the condition of generator 1?"
        res = self.classifier.classify(query, default_station="Maitri")
        self.assertEqual(res.intent, IntentType.SIMPLE_TELEMETRY_QUERY)
        self.assertFalse(res.requires_simulation)
        ans = self.resolver.resolve(res.intent, res.entities)
        self.assertIn("RUNNING", ans.text)
        self.assertIn("125", ans.text)


if __name__ == "__main__":
    unittest.main()
