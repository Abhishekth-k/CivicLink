-- CivicLink AI Database Schema (PostgreSQL)

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(200)
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role_id INT NOT NULL REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Citizen Profiles
CREATE TABLE IF NOT EXISTS citizen_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address VARCHAR(255),
    loyalty_points INT DEFAULT 0
);

-- Worker Profiles
CREATE TABLE IF NOT EXISTS worker_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    rating FLOAT DEFAULT 5.0
);

-- Manager Profiles
CREATE TABLE IF NOT EXISTS manager_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL,
    assigned_region VARCHAR(100) NOT NULL
);

-- Reports (Civic Problems)
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    address VARCHAR(255),
    citizen_id INT NOT NULL REFERENCES users(id),
    assigned_worker_id INT REFERENCES users(id),
    
    -- AI fields
    ai_estimated_severity VARCHAR(50),
    ai_recommended_department VARCHAR(100),
    ai_summary TEXT,
    ai_suggested_solution TEXT,
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_of_id INT REFERENCES reports(id),
    
    -- Social worker files
    before_image_url VARCHAR(500),
    after_image_url VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Report Images Table
CREATE TABLE IF NOT EXISTS report_images (
    id SERIAL PRIMARY KEY,
    report_id INT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    report_id INT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    worker_id INT NOT NULL REFERENCES users(id),
    manager_id INT NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'PENDING',
    rejection_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    report_id INT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    sender_id INT NOT NULL REFERENCES users(id),
    receiver_id INT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weather Cache
CREATE TABLE IF NOT EXISTS weather_cache (
    id SERIAL PRIMARY KEY,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    temp FLOAT NOT NULL,
    humidity FLOAT NOT NULL,
    rain FLOAT,
    wind_speed FLOAT NOT NULL,
    condition VARCHAR(100) NOT NULL,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values TEXT,
    new_values TEXT,
    changed_by_id INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Settings
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value VARCHAR(500) NOT NULL,
    description VARCHAR(255)
);
