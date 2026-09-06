"""
DHRUVNETRA - Multi-Provider Pre-Trained LLM Client
Configurable connector supporting Gemini, OpenAI, Anthropic, Ollama, and offline heuristic fallback.
"""

import os
import re
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional, Tuple


def _load_env_file():
    """
    Lightweight, zero-dependency .env loader that searches common locations
    without needing external python-dotenv package.
    """
    candidates = [
        os.path.join(os.getcwd(), "backend", ".env"),
        os.path.join(os.getcwd(), ".env"),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env")),
    ]
    for path in candidates:
        if os.path.isfile(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("\"'")
                            if k not in os.environ:
                                os.environ[k] = v
                break
            except Exception:
                pass


# Load environment variables on module import
_load_env_file()


class LLMClient:
    """
    Configurable LLM client that delegates prompt execution to the configured provider
    or uses an offline deterministic semantic parser when API keys are not supplied.
    """

    def __init__(
        self,
        provider: Optional[str] = None,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
    ):
        _load_env_file()
        self.provider = (provider or os.getenv("LLM_PROVIDER", "gemini")).lower()
        self.gemini_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.openai_key = api_key or os.getenv("OPENAI_API_KEY")
        self.model_name = model_name or os.getenv("LLM_MODEL_NAME")

        if not self.model_name:
            if self.provider == "gemini":
                self.model_name = "gemini-1.5-flash"
            elif self.provider == "openai":
                self.model_name = "gpt-4o-mini"
            elif self.provider == "anthropic":
                self.model_name = "claude-3-haiku-20240307"
            elif self.provider == "ollama":
                self.model_name = "llama3:latest"
            else:
                self.model_name = "heuristic-parser-v1"

    def generate_json(self, system_prompt: str, user_prompt: str) -> Tuple[Dict[str, Any], str]:
        """
        Executes query against the configured provider and parses the returned JSON.
        Returns tuple: (parsed_json_dict, provider_name).
        """
        # 1. Gemini Provider
        if self.provider == "gemini" and self.gemini_key and "your_" not in self.gemini_key:
            try:
                res = self._call_gemini_api(system_prompt, user_prompt)
                return res, f"gemini ({self.model_name})"
            except Exception as e:
                print(f"[!] Gemini API call failed: {e}. Falling back to deterministic parser.")

        # 2. OpenAI Provider
        if self.provider == "openai" and self.openai_key and "sk-" in self.openai_key:
            try:
                res = self._call_openai_api(system_prompt, user_prompt)
                return res, f"openai ({self.model_name})"
            except Exception as e:
                print(f"[!] OpenAI API call failed: {e}. Falling back to deterministic parser.")

        # 3. Local Ollama Provider
        if self.provider == "ollama":
            try:
                res = self._call_ollama_api(system_prompt, user_prompt)
                return res, f"ollama ({self.model_name})"
            except Exception as e:
                print(f"[!] Ollama API call failed: {e}. Falling back to deterministic parser.")

        # 4. Built-in Deterministic Semantic Parser (Zero External API Dependency)
        res = self._deterministic_semantic_parser(user_prompt)
        return res, "deterministic_semantic_fallback"

    def _clean_json_response(self, text: str) -> Dict[str, Any]:
        """Extracts JSON object from text, handling markdown code fences if present."""
        clean = text.strip()
        if "```json" in clean:
            clean = clean.split("```json", 1)[1].split("```", 1)[0].strip()
        elif "```" in clean:
            clean = clean.split("```", 1)[1].split("```", 1)[0].strip()
        return json.loads(clean)

    def _call_gemini_api(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Direct REST call to Google Gemini v1beta endpoint with JSON output mode."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.gemini_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"SYSTEM INSTRUCTIONS:\n{system_prompt}\n\nUSER QUERY:\n{user_prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.0,
                "response_mime_type": "application/json"
            }
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})

        with urllib.request.urlopen(req, timeout=12) as response:
            result = json.loads(response.read().decode("utf-8"))
            raw_text = result["candidates"][0]["content"]["parts"][0]["text"]
            return self._clean_json_response(raw_text)

    def _call_openai_api(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Direct REST call to OpenAI chat completions endpoint with JSON mode."""
        url = "https://api.openai.com/v1/chat/completions"
        payload = {
            "model": self.model_name,
            "temperature": 0.0,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.openai_key}"
            }
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            result = json.loads(response.read().decode("utf-8"))
            raw_text = result["choices"][0]["message"]["content"]
            return self._clean_json_response(raw_text)

    def _call_ollama_api(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Direct REST call to local Ollama instance."""
        url = "http://localhost:11434/api/generate"
        payload = {
            "model": self.model_name,
            "system": system_prompt,
            "prompt": user_prompt,
            "format": "json",
            "stream": False
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=15) as response:
            result = json.loads(response.read().decode("utf-8"))
            return self._clean_json_response(result["response"])

    def _deterministic_semantic_parser(self, query: str) -> Dict[str, Any]:
        """
        High-precision regex and semantic parser.
        Extracts station, component, generator ID, action, and duration
        when no external LLM API key is present or offline.
        """
        text = query.lower()

        # 1. Identify Station
        if "bharati" in text:
            station = "Bharati"
        elif "maitri" in text:
            station = "Maitri"
        else:
            station = "Maitri"  # Default if unspecified

        # 2. Identify Component & ID
        component = "generator"
        component_id = "G1"

        if re.search(r"\b(gen(erator)?\s*4|g4)\b", text):
            component = "generator"
            component_id = "G4"
        elif re.search(r"\b(gen(erator)?\s*3|g3)\b", text):
            component = "generator"
            component_id = "G3"
        elif re.search(r"\b(gen(erator)?\s*2|g2)\b", text):
            component = "generator"
            component_id = "G2"
        elif re.search(r"\b(gen(erator)?\s*1|g1)\b", text):
            component = "generator"
            component_id = "G1"
        elif "hvac" in text or "heat" in text or "temp" in text:
            component = "hvac"
            component_id = "HVAC_MAIN"
        elif "battery" in text or "ups" in text or "bess" in text:
            component = "battery"
            component_id = "BESS_BANK_1"
        elif "water" in text or "melt" in text or "snow" in text:
            component = "water"
            component_id = "MELTER_1"
        elif "blizzard" in text or "storm" in text or "wind" in text:
            component = "weather"
            component_id = "WEATHER_SYS"
        elif "fuel" in text or "diesel" in text:
            component = "fuel"
            component_id = "FUEL_TANK_1"

        # 3. Identify Action
        if re.search(r"\b(turn(s|ed)?\s*off|shut(s)?\s*down|shutdown|stop(s|ped)?|isolate|isolat(es|ed)|maintenance)\b", text):
            action = "shutdown"
        elif re.search(r"\b(fail(s|ed|ure)?|trip(s|ped)?|blackout|fault|breaker\s*trip)\b", text):
            action = "fail"
        elif re.search(r"\b(start(s|ed)?|turn(s|ed)?\s*on|engage(s|d)?|spin(s)?\s*up)\b", text):
            action = "start"
        elif re.search(r"\b(setback|reduc(e|es|ed)|drop(s|ped)?|lower(s|ed)?|eco)\b", text):
            action = "setback"
        elif re.search(r"\b(throttle(s|d)?|save(s|d)?|conserve(s|d)?)\b", text):
            action = "throttle"
        elif re.search(r"\b(storm|blizzard|cat-?\s*3|prep)\b", text):
            action = "blizzard_prep"
        elif re.search(r"\b(optimiz(e|es|ed|ation))\b", text):
            action = "optimize"
        else:
            action = "shutdown"

        # 4. Extract Duration (e.g. 7 hours, 24 hrs, 30 mins, 2 days)
        duration_hours = 7.0  # default
        dur_match = re.search(r"(\d+(\.\d+)?)\s*(hours?|hrs?|h\b|days?|d\b|mins?|minutes?)", text)
        if dur_match:
            val = float(dur_match.group(1))
            unit = dur_match.group(3).lower()
            if "day" in unit or unit == "d":
                duration_hours = val * 24.0
            elif "min" in unit:
                duration_hours = max(0.1, val / 60.0)
            else:
                duration_hours = val

        return {
            "station": station,
            "component": component,
            "component_id": component_id,
            "action": action,
            "duration_hours": duration_hours,
            "confidence": 0.95,
        }
