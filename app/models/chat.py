from pydantic import BaseModel, Field


class CreateChatSessionRequest(BaseModel):
    title: str | None = Field(default=None, max_length=120)


class UpdateChatSessionRequest(BaseModel):
    title: str = Field(min_length=1, max_length=120)


class AskChatRequest(BaseModel):
    question: str = Field(min_length=1)
    max_num_results: int = Field(default=8, ge=1, le=20)


class SyncVectorStoreRequest(BaseModel):
    force_upload: bool = False
