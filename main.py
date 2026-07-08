import os
import datetime
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas, auth, database
from google import genai
from google.genai import types

app = FastAPI(title="CivicLink AI API", version="1.0.0")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Client if API key is present
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_client = None
if GEMINI_API_KEY:
    try:
        gemini_client = genai.GoogleGenAI(apiKey=GEMINI_API_KEY)
    except Exception as e:
        print(f"Error setting up Gemini Client in FastAPI: {e}")

@app.on_event("startup")
def startup():
    # Database table initialization (for simple local run setup)
    try:
        models.Base.metadata.create_all(bind=database.engine)
        print("Database tables initialized.")
    except Exception as e:
        print(f"Database initialization failed: {e}")

# API Endpoints

# AUTH
@app.post("/api/auth/register", response_model=schemas.Token)
def register(user_data: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check or create role
    role = db.query(models.Role).filter(models.Role.name == user_data.role_name.upper()).first()
    if not role:
        role = models.Role(name=user_data.role_name.upper(), description=f"{user_data.role_name} Role")
        db.add(role)
        db.commit()
        db.refresh(role)
        
    hashed_pw = auth.get_password_hash(user_data.password)
    new_user = models.User(
        email=user_data.email,
        hashed_password=hashed_pw,
        full_name=user_data.full_name,
        phone=user_data.phone,
        role_id=role.id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create profile based on role
    if role.name == "CITIZEN":
        profile = models.CitizenProfile(user_id=new_user.id)
        db.add(profile)
    elif role.name == "SOCIAL_WORKER":
        profile = models.WorkerProfile(user_id=new_user.id, department=user_data.department or "General Sanitation")
        db.add(profile)
    elif role.name == "MANAGER":
        profile = models.ManagerProfile(
            user_id=new_user.id, 
            department=user_data.department or "Public Works",
            assigned_region=user_data.assigned_region or "District 1"
        )
        db.add(profile)
    db.commit()
    
    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}

@app.post("/api/auth/login", response_model=schemas.Token)
def login(login_data: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if user.is_suspended:
        raise HTTPException(status_code=403, detail="Your account is suspended. Please contact support.")
        
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.post("/api/auth/forgot-password")
def forgot_password(req: schemas.ForgotPasswordRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email address not found")
    # In production, send reset email. For now, return confirmation.
    return {"status": "success", "message": "Password reset instructions sent to your email."}

# REPORTS
@app.post("/api/reports", response_model=schemas.ReportResponse)
def create_report(
    report_data: schemas.ReportCreate, 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    # Run Gemini analysis if images are provided
    ai_severity = "MEDIUM"
    ai_dept = "Public Works"
    ai_sum = f"Reported problem: {report_data.title}"
    ai_sol = "Standard department inspection scheduled."
    is_dup = False
    
    if gemini_client and report_data.images:
        try:
            # Prepare image for Gemini if base64/url is available
            # In production, we decode and send inlineData
            # For this FastAPI endpoint, we simulate Gemini analysis call
            prompt = f"""
            Analyze this civic complaint image and details:
            Title: {report_data.title}
            Description: {report_data.description}
            
            Provide structured JSON response with:
            1. Estimated Severity (LOW, MEDIUM, HIGH, CRITICAL)
            2. Recommended Department (Sanitation, Roads, Electrical, Water, Traffic, Pollution)
            3. A short concise Summary (max 100 words)
            4. Suggested Solution (how a worker can fix this)
            """
            response = gemini_client.models.generateContent(
                model="gemini-3.5-flash",
                contents=prompt
            )
            # Standard post-processing or json loading goes here
            ai_sum = response.text or ai_sum
        except Exception as e:
            print(f"Gemini API failure in FastAPI: {e}")
            
    # Create report DB entry
    new_report = models.Report(
        title=report_data.title,
        description=report_data.description,
        category=report_data.category,
        latitude=report_data.latitude,
        longitude=report_data.longitude,
        address=report_data.address,
        citizen_id=current_user.id,
        ai_estimated_severity=ai_severity,
        ai_recommended_department=ai_dept,
        ai_summary=ai_sum,
        ai_suggested_solution=ai_sol,
        is_duplicate=is_dup
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    # Save image URLs
    for url in report_data.images:
        img = models.ReportImage(report_id=new_report.id, image_url=url)
        db.add(img)
    db.commit()
    db.refresh(new_report)
    
    # Log Activity
    log = models.ActivityLog(user_id=current_user.id, action="REPORT_CREATED", details=f"Report ID {new_report.id} created")
    db.add(log)
    db.commit()
    
    return new_report

@app.get("/api/reports", response_model=List[schemas.ReportResponse])
def get_reports(
    category: Optional[str] = None, 
    status: Optional[str] = None, 
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Report)
    if category:
        query = query.filter(models.Report.category == category)
    if status:
        query = query.filter(models.Report.status == status)
    return query.all()

@app.get("/api/reports/{report_id}", response_model=schemas.ReportResponse)
def get_report(report_id: int, db: Session = Depends(database.get_db)):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

# WORKER / MANAGER ACTIONS
@app.post("/api/assignments", response_model=schemas.AssignmentResponse)
def assign_report(
    assignment_data: schemas.AssignmentCreate,
    current_user: models.User = Depends(auth.RoleChecker(["MANAGER", "SUPER_ADMIN"])),
    db: Session = Depends(database.get_db)
):
    report = db.query(models.Report).filter(models.Report.id == assignment_data.report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    report.assigned_worker_id = assignment_data.worker_id
    report.status = "ASSIGNED"
    
    new_assignment = models.Assignment(
        report_id=report.id,
        worker_id=assignment_data.worker_id,
        manager_id=current_user.id,
        status="PENDING"
    )
    db.add(new_assignment)
    
    # Create notification for worker
    notif = models.Notification(
        user_id=assignment_data.worker_id,
        title="New Task Assigned",
        message=f"You have been assigned a task: {report.title}"
    )
    db.add(notif)
    db.commit()
    db.refresh(new_assignment)
    return new_assignment

# WEATHER
@app.get("/api/weather", response_model=schemas.WeatherInfo)
def get_weather(lat: float, lon: float, db: Session = Depends(database.get_db)):
    # Simple simulated weather check, can integrate standard free API key
    return {
        "latitude": lat,
        "longitude": lon,
        "temp": 24.5,
        "humidity": 68.0,
        "rain": 0.0,
        "wind_speed": 12.5,
        "condition": "Partly Cloudy"
    }
