from enum import Enum

from pydantic import BaseModel, Field, field_validator


class Difficulty(str, Enum):
    easy = "Easy"
    medium = "Medium"
    hard = "Hard"


class Message(BaseModel):
    role: str
    content: str = Field(min_length=1, max_length=8000)

    @field_validator("role")
    @classmethod
    def valid_role(cls, value: str) -> str:
        if value not in {"interviewer", "candidate"}:
            raise ValueError("role must be 'interviewer' or 'candidate'")
        return value


class InterviewContext(BaseModel):
    topic: str = Field(min_length=2, max_length=120)
    difficulty: Difficulty

    @field_validator("topic")
    @classmethod
    def clean_topic(cls, value: str) -> str:
        value = " ".join(value.split())
        if len(value) < 2:
            raise ValueError("Please enter a topic with at least 2 characters.")
        return value


class StartRequest(InterviewContext):
    pass


class AnswerRequest(InterviewContext):
    conversation: list[Message] = Field(min_length=1, max_length=40)


class ReportRequest(InterviewContext):
    conversation: list[Message] = Field(min_length=2, max_length=40)


class InterviewReply(BaseModel):
    message: str = Field(min_length=1)
    is_complete: bool


class Report(BaseModel):
    score: int = Field(ge=0, le=100)
    strengths: list[str] = Field(min_length=1, max_length=6)
    weaknesses: list[str] = Field(min_length=1, max_length=6)
    topics_to_revise: list[str] = Field(min_length=1, max_length=6)
    verdict: str = Field(min_length=1, max_length=1000)
    result: str

    @field_validator("result")
    @classmethod
    def valid_result(cls, value: str) -> str:
        normalized = value.upper()
        if normalized not in {"PASS", "FAIL"}:
            raise ValueError("result must be PASS or FAIL")
        return normalized

