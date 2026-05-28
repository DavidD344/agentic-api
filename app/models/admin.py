from pydantic import BaseModel, Field


class RunPipelineRequest(BaseModel):
    limit: int | None = Field(default=None, ge=1)

