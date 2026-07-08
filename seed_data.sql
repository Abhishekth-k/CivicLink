-- Seed Roles
INSERT INTO roles (id, name, description) VALUES
(1, 'CITIZEN', 'Standard public citizen user'),
(2, 'SOCIAL_WORKER', 'Field staff who solves reported issues'),
(3, 'MANAGER', 'Regional supervisor who assigns tasks and reviews work'),
(4, 'SUPER_ADMIN', 'Global administrator with complete control')
ON CONFLICT (id) DO NOTHING;

-- Seed Users (Passwords are 'password123' hashed using standard bcrypt context)
-- Hashed value for 'password123' is '$2b$12$R9h/lIPzNgi.23g/SJDZ7e9IInN09uY4hG6O2R66LgscMepK59b7K'
INSERT INTO users (id, email, hashed_password, full_name, phone, role_id, is_active, is_suspended) VALUES
(1, 'citizen@civiclink.ai', '$2b$12$R9h/lIPzNgi.23g/SJDZ7e9IInN09uY4hG6O2R66LgscMepK59b7K', 'John Doe', '+15551112222', 1, true, false),
(2, 'worker@civiclink.ai', '$2b$12$R9h/lIPzNgi.23g/SJDZ7e9IInN09uY4hG6O2R66LgscMepK59b7K', 'Bob Builder', '+15553334444', 2, true, false),
(3, 'manager@civiclink.ai', '$2b$12$R9h/lIPzNgi.23g/SJDZ7e9IInN09uY4hG6O2R66LgscMepK59b7K', 'Alice Supervisor', '+15555556666', 3, true, false),
(4, 'admin@civiclink.ai', '$2b$12$R9h/lIPzNgi.23g/SJDZ7e9IInN09uY4hG6O2R66LgscMepK59b7K', 'Super Admin', '+15557778888', 4, true, false)
ON CONFLICT (id) DO NOTHING;

-- Seed Profiles
INSERT INTO citizen_profiles (user_id, address, loyalty_points) VALUES
(1, '123 Main St, Springfield', 120)
ON CONFLICT DO NOTHING;

INSERT INTO worker_profiles (user_id, department, status, rating) VALUES
(2, 'Sanitation & Roads', 'AVAILABLE', 4.8)
ON CONFLICT DO NOTHING;

INSERT INTO manager_profiles (user_id, department, assigned_region) VALUES
(3, 'Public Infrastructure', 'Springfield Metro Area')
ON CONFLICT DO NOTHING;

-- Seed Reports
INSERT INTO reports (id, title, description, category, priority, status, latitude, longitude, address, citizen_id, assigned_worker_id, ai_estimated_severity, ai_recommended_department, ai_summary, ai_suggested_solution) VALUES
(1, 'Deep Pothole on Maple Avenue', 'There is an extremely deep pothole near the intersection of Maple Ave and 4th St. It is a hazard to passing motorists and could easily damage tires or cause accidents.', 'Potholes', 'HIGH', 'SUBMITTED', 37.7749, -122.4194, 'Maple Ave & 4th St, Springfield', 1, NULL, 'HIGH', 'Road Infrastructure', 'Deep pothole reported at Maple Ave. Vehicle hazard.', 'Fill with quick-setting cold-patch asphalt, compact thoroughly, and seal edges.'),
(2, 'Broken Streetlight near Park Entry', 'The streetlight near the east entry of Springfield Public Park has been flickering and is now completely dark. This makes the footpath very dark at night.', 'Streetlight', 'MEDIUM', 'ASSIGNED', 37.7833, -122.4167, 'East Entrance, Public Park', 1, 2, 'MEDIUM', 'Electrical Grid', 'Broken streetlight causing poor lighting at park pathway.', 'Replace the 150W HPS lamp with a modern, energy-efficient LED fixture and inspect wiring.'),
(3, 'Illegal Garbage Dumping', 'Someone dumped a large pile of construction debris and household garbage on the side of the road.', 'Garbage', 'MEDIUM', 'RESOLVED', 37.7794, -122.4224, '282 Industrial Parkway, Springfield', 1, 2, 'MEDIUM', 'Sanitation Department', 'Construction waste illegally dumped on roadway shoulder.', 'Deploy loader and heavy haul truck to collect and safely dispose of construction waste.')
ON CONFLICT (id) DO NOTHING;

-- Seed Report Images
INSERT INTO report_images (report_id, image_url) VALUES
(1, 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800'),
(2, 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&q=80&w=800'),
(3, 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800')
ON CONFLICT DO NOTHING;
