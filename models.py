import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Float, Table
from sqlalchemy.orm import relationship
from database import Base

# Association table for reports and images
class ReportImage(Base):
    __tablename__ = 'report_images'
    
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey('reports.id', ondelete='CASCADE'), nullable=False)
    image_url = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    report = relationship("Report", back_populates="images")

class Role(Base):
    __tablename__ = 'roles'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False) # CITIZEN, SOCIAL_WORKER, MANAGER, SUPER_ADMIN
    description = Column(String(200), nullable=True)

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    role_id = Column(Integer, ForeignKey('roles.id'), nullable=False)
    is_active = Column(Boolean, default=True)
    is_suspended = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    role = relationship("Role")
    citizen_profile = relationship("CitizenProfile", uselist=False, back_populates="user")
    worker_profile = relationship("WorkerProfile", uselist=False, back_populates="user")
    manager_profile = relationship("ManagerProfile", uselist=False, back_populates="user")

class CitizenProfile(Base):
    __tablename__ = 'citizen_profiles'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    address = Column(String(255), nullable=True)
    loyalty_points = Column(Integer, default=0)
    
    user = relationship("User", back_populates="citizen_profile")

class WorkerProfile(Base):
    __tablename__ = 'worker_profiles'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    department = Column(String(100), nullable=False) # Sanitation, Roads, Electrical, etc.
    status = Column(String(50), default="AVAILABLE") # AVAILABLE, BUSY, OFFLINE
    rating = Column(Float, default=5.0)
    
    user = relationship("User", back_populates="worker_profile")

class ManagerProfile(Base):
    __tablename__ = 'manager_profiles'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    department = Column(String(100), nullable=False)
    assigned_region = Column(String(100), nullable=False)
    
    user = relationship("User", back_populates="manager_profile")

class Report(Base):
    __tablename__ = 'reports'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False) # Garbage, Potholes, Streetlight, Water leakage, Drainage, Flood, Fire, Smoke, Illegal dumping, Road damage, Tree fall, Animal rescue, Traffic, Pollution, Other
    priority = Column(String(50), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), default="SUBMITTED") # SUBMITTED, REVIEWED, ASSIGNED, IN_PROGRESS, RESOLVED, REJECTED, APPROVED
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(255), nullable=True)
    
    citizen_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    assigned_worker_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # AI generated fields
    ai_estimated_severity = Column(String(50), nullable=True)
    ai_recommended_department = Column(String(100), nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_suggested_solution = Column(Text, nullable=True)
    is_duplicate = Column(Boolean, default=False)
    duplicate_of_id = Column(Integer, ForeignKey('reports.id'), nullable=True)
    
    # Before and After photos for Social Worker flow
    before_image_url = Column(String(500), nullable=True)
    after_image_url = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    citizen = relationship("User", foreign_keys=[citizen_id])
    assigned_worker = relationship("User", foreign_keys=[assigned_worker_id])
    images = relationship("ReportImage", back_populates="report", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="report")

class Assignment(Base):
    __tablename__ = 'assignments'
    
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey('reports.id', ondelete='CASCADE'), nullable=False)
    worker_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    manager_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    status = Column(String(50), default="PENDING") # PENDING, ACCEPTED, REJECTED, COMPLETED
    rejection_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    report = relationship("Report", back_populates="assignments")
    worker = relationship("User", foreign_keys=[worker_id])
    manager = relationship("User", foreign_keys=[manager_id])

class Notification(Base):
    __tablename__ = 'notifications'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Message(Base):
    __tablename__ = 'messages'
    
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey('reports.id', ondelete='CASCADE'), nullable=False)
    sender_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    receiver_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

class WeatherCache(Base):
    __tablename__ = 'weather_cache'
    
    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    temp = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    rain = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=False)
    condition = Column(String(100), nullable=False)
    cached_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class ActivityLog(Base):
    __tablename__ = 'activity_logs'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = 'audit_logs'
    
    id = Column(Integer, primary_key=True, index=True)
    table_name = Column(String(100), nullable=False)
    record_id = Column(Integer, nullable=False)
    action = Column(String(50), nullable=False) # INSERT, UPDATE, DELETE
    old_values = Column(Text, nullable=True)
    new_values = Column(Text, nullable=True)
    changed_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SystemSetting(Base):
    __tablename__ = 'settings'
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(String(500), nullable=False)
    description = Column(String(255), nullable=True)
