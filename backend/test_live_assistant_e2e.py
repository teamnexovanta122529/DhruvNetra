"""
DHRUVNETRA - E2E Live Assistant Operational Intelligence Test Suite
SIH 2026: Validates complete conversational What-If simulation flow.
"""

import unittest
import sys
import os
import asyncio

# Ensure project root in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.schemas.whatif import WhatIfRequest
from backend.app.api.routes.whatif import process_operational_query
from backend.ai.intent.intent_classifier import QueryIntentClassifier, IntentType


class TestOperationalIntelligenceE2E(unittest.IsolatedAsyncioTestCase):

    async def test_complete_mission_commander_conversation(self):
        """
        Tests the exact conversation sequence specified in Section 26:
        1. Condition of G1
        2. What if turned off for 8 hours
        3. What if Generator 2 also goes off
        4. Would that be safe?
        5. What should I do instead?
        6. Will shutting G1 save fuel?
        """
        print("\n" + "="*70)
        print(">> RUNNING DHRUVNETRA CHAT-FIRST OPERATIONAL INTELLIGENCE E2E TEST")
        print("="*70)

        # -------------------------------------------------------------
        # STEP 1: "What is the condition of Generator 1?"
        # -------------------------------------------------------------
        q1 = "What is the condition of Generator 1?"
        print(f"\n[USER 1]: '{q1}'")
        req1 = WhatIfRequest(query=q1, station="Maitri")
        res1 = await process_operational_query(req1)

        print(f"[AI 1 Response Type]: {res1.response_type} (Intent: {res1.intent})")
        print(f"[AI 1 Text]: {res1.text[:120]}...")
        self.assertTrue(res1.success)
        self.assertIn(res1.intent, ["SIMPLE_TELEMETRY_QUERY", "SYSTEM_STATUS_QUERY", "GENERATOR_STATUS_QUERY"])
        self.assertIsNotNone(res1.telemetry_badge)
        self.assertIn("125", str(res1.telemetry_badge.value))

        # -------------------------------------------------------------
        # STEP 2: "What if I turn it off for 8 hours?" (Pronoun resolution + What-If)
        # -------------------------------------------------------------
        q2 = "What if I turn it off for 8 hours?"
        print(f"\n[USER 2]: '{q2}' (relative to G1)")
        req2 = WhatIfRequest(
            query=q2,
            station="Maitri",
            previous_query=q1,
            previous_intent=res1.intent,
        )
        res2 = await process_operational_query(req2)

        print(f"[AI 2 Response Type]: {res2.response_type} (Intent: {res2.intent})")
        print(f"[AI 2 Affected Gens]: {res2.scenario.affected_generators}")
        print(f"[AI 2 Duration]: {res2.scenario.duration_hours}h")

        self.assertTrue(res2.success)
        self.assertEqual(res2.intent, IntentType.WHAT_IF_SCENARIO.value)
        self.assertEqual(res2.scenario.affected_generators, ["G1"])
        self.assertEqual(res2.scenario.duration_hours, 8.0)
        self.assertIn("Operational impact", res2.aiResponse)
        self.assertIn("Fuel impact", res2.aiResponse)
        self.assertIn("System impact", res2.aiResponse)
        self.assertIn("Risk", res2.aiResponse)
        self.assertIn("Should you do it?", res2.aiResponse)
        self.assertIn("Recommended action", res2.aiResponse)

        # -------------------------------------------------------------
        # STEP 3: "What if Generator 2 also goes off?" (Multi-generator extension)
        # -------------------------------------------------------------
        q3 = "What if Generator 2 also goes off?"
        print(f"\n[USER 3]: '{q3}' (extending G1 scenario)")
        req3 = WhatIfRequest(
            query=q3,
            station="Maitri",
            active_scenario=res2.scenario.dict(),
            previous_query=q2,
            previous_intent=res2.intent,
        )
        res3 = await process_operational_query(req3)

        print(f"[AI 3 Response Type]: {res3.response_type} (Intent: {res3.intent})")
        print(f"[AI 3 Affected Gens]: {res3.scenario.affected_generators}")
        print(f"[AI 3 Duration]: {res3.scenario.duration_hours}h")
        print(f"[AI 3 Risk]: {res3.risk.overall_risk}")

        self.assertTrue(res3.success)
        self.assertEqual(res3.intent, IntentType.WHAT_IF_SCENARIO.value)
        self.assertIn("G1", res3.scenario.affected_generators)
        self.assertIn("G2", res3.scenario.affected_generators)
        self.assertEqual(res3.scenario.duration_hours, 8.0)
        self.assertIn(res3.risk.overall_risk, ["HIGH", "CRITICAL"])

        # -------------------------------------------------------------
        # STEP 4: "Would that be safe?" (Safety assessment on active combined scenario)
        # -------------------------------------------------------------
        q4 = "Would that be safe?"
        print(f"\n[USER 4]: '{q4}'")
        req4 = WhatIfRequest(
            query=q4,
            station="Maitri",
            active_scenario=res3.scenario.dict(),
            previous_query=q3,
            previous_intent=res3.intent,
        )
        res4 = await process_operational_query(req4)

        print(f"[AI 4 Response Type]: {res4.response_type} (Intent: {res4.intent})")
        self.assertTrue(res4.success)
        self.assertIn("NOT RECOMMENDED", res4.aiResponse.upper() + res4.recommendation.upper())

        # -------------------------------------------------------------
        # STEP 5: "What should I do instead?" (Mitigation directive)
        # -------------------------------------------------------------
        q5 = "What should I do instead?"
        print(f"\n[USER 5]: '{q5}'")
        req5 = WhatIfRequest(
            query=q5,
            station="Maitri",
            active_scenario=res3.scenario.dict(),
            previous_query=q4,
            previous_intent=res4.intent,
        )
        res5 = await process_operational_query(req5)

        print(f"[AI 5 Response Type]: {res5.response_type}")
        self.assertTrue(res5.success)
        self.assertTrue(len(res5.aiResponse) > 20)

        # -------------------------------------------------------------
        # STEP 6: "Will shutting G1 save fuel?" (Fuel trade-off analysis)
        # -------------------------------------------------------------
        q6 = "Will shutting G1 save fuel?"
        print(f"\n[USER 6]: '{q6}'")
        req6 = WhatIfRequest(
            query=q6,
            station="Maitri",
            previous_query=q1,
            previous_intent="SIMPLE_TELEMETRY_QUERY",
        )
        res6 = await process_operational_query(req6)

        print(f"[AI 6 Response Type]: {res6.response_type}")
        self.assertTrue(res6.success)
        self.assertIn("Fuel impact", res6.aiResponse)

        print("="*70)
        print("ALL CONVERSATIONAL E2E TEST STEPS PASSED PERFECTLY")
        print("="*70)


if __name__ == "__main__":
    unittest.main()
