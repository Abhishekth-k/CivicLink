from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role_name: str # CITIZEN, SOCIAL_WORKER, MANAGER, SUPER_ADMIN
    department: Optional[str] = None # For Workers & Managers
    assigned_region: Optional[str] = None # For Managers

class UserResponse(UserBase):
    id: int
    role_id: int
    is_active: bool
    is_suspended: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ReportImageResponse(BaseModel):
    id: int
    report_id: int
    image_url: str
    created_at: datetime

    class Config:
        from_attributes = True

class ReportCreate(BaseModel):
    title: str
    description: str
    category: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    images: List[str] = [] # list of base64 images or image URLs

class ReportResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str
    status: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    citizen_id: int
    assigned_worker_id: Optional[int] = None
    ai_estimated_severity: Optional[str] = None
    ai_recommended_department: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_suggested_solution: Optional[str] = None
    is_duplicate: bool
    duplicate_of_id: Optional[int] = None
    before_image_url: Optional[str] = None
    after_image_url: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    images: List[ReportImageResponse] = []

    class Config:
        from_attributes = True

class AssignmentCreate(BaseModel):
    report_id: int
    worker_id: int

class AssignmentResponse(BaseModel):
    id: int
    report_id: int
    worker_id: int
    manager_id: int
    status: str
    rejection_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    report_id: int
    receiver_id: int
    content: str

class MessageResponse(BaseModel):
    id: int
    report_id: int
    sender_id: int
    receiver_id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class WeatherInfo(BaseModel):
    latitude: float
    longitude: float
    temp: float
    humidity: float
    rain: Optional[float] = None
    wind_speed: float
    condition: str
