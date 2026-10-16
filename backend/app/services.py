import json

from groq import AsyncGroq

from .config import Settings
from .prompts import INTERVIEWER_SYSTEM_PROMPT, REPORT_SYSTEM_PROMPT
from .schemas import InterviewReply, Message, Report


class AIServiceError(Exception):
    pass


def _transcript(messages: list[Message]) -> str:
    return "\n".join(f"{m.role.upper()}: {m.content}" for m in messages)


class InterviewService:
    def __init__(self, settings: Settings):
        if not settings.groq_api_key or settings.groq_api_key == "your_groq_api_key_here":
            raise AIServiceError("Groq is not configured. Add GROQ_API_KEY to backend/.env and restart the server.")
        self.client = AsyncGroq(api_key=settings.groq_api_key)
        self.model = settings.groq_model

    async def _json_completion(self, system: str, user: str) -> dict:
        try:
            completion = await self.client.chat.completions.create(
                model=self.model,
                temperature=0.35,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            )
            content = completion.choices[0].message.content
            if not content:
                raise AIServiceError("The AI returned an empty response. Please try again.")
            return json.loads(content)
        except AIServiceError:
            raise
        except json.JSONDecodeError as exc:
            raise AIServiceError("The AI returned an invalid response. Please try again.") from exc
        except Exception as exc:
            raise AIServiceError("The AI provider is unavailable right now. Please try again shortly.") from exc

    async def start(self, topic: str, difficulty: str) -> InterviewReply:
        system = INTERVIEWER_SYSTEM_PROMPT.format(topic=topic, difficulty=difficulty)
        data = await self._json_completion(system, "Begin the interview with a brief welcome and the first question.")
        return InterviewReply.model_validate(data)

    async def answer(self, topic: str, difficulty: str, conversation: list[Message]) -> InterviewReply:
        system = INTERVIEWER_SYSTEM_PROMPT.format(topic=topic, difficulty=difficulty)
        data = await self._json_completion(system, f"Continue this interview.\n\n{_transcript(conversation)}")
        return InterviewReply.model_validate(data)

    async def report(self, topic: str, difficulty: str, conversation: list[Message]) -> Report:
        system = REPORT_SYSTEM_PROMPT.format(topic=topic, difficulty=difficulty)
        data = await self._json_completion(system, f"Evaluate this transcript.\n\n{_transcript(conversation)}")
        report = Report.model_validate(data)
        expected = "PASS" if report.score >= 55 else "FAIL"
        return report.model_copy(update={"result": expected})

