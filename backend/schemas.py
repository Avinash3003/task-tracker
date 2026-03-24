from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional
from models import TaskStatus

class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    confirm_password: str

    @field_validator("username")
    @classmethod
    def username_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Username cannot be empty")
        return v.strip()

    @field_validator("email")
    @classmethod
    def email_not_empty(cls, v: str) -> str:
        if not v.strip() or "@" not in v:
            raise ValueError("Valid email is required")
        return v.strip()

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class ForgotPassword(BaseModel):
    username: str
    new_password: str
    confirm_password: str

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v

class UserDeleteRequest(BaseModel):
    password: str


class UserBase(BaseModel):
    id: int
    username: str
    email: str
    model_config = {"from_attributes": True}


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    deadline_date: Optional[str] = None
    assigned_user_id: Optional[int] = None
    status: Optional[TaskStatus] = TaskStatus.TODO

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    status: TaskStatus
    created_at: datetime
    status_updated_at: datetime
    deadline_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    is_deleted: bool
    user_id: int
    owner: UserBase
    assigned_user_id: Optional[int] = None
    assignee: Optional[UserBase] = None

    model_config = {"from_attributes": True}


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskAssignUpdate(BaseModel):
    assigned_user_id: Optional[int] = None



class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    username: str
    user_id: int
