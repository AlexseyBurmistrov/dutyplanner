-- Create tables for duty planning system

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Duties table
CREATE TABLE IF NOT EXISTS duties (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    hour INTEGER NOT NULL,
    user_id INTEGER REFERENCES users(id),
    custom_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Absences table
CREATE TABLE IF NOT EXISTS absences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Week settings table
CREATE TABLE IF NOT EXISTS week_settings (
    id SERIAL PRIMARY KEY,
    week_start DATE NOT NULL,
    work_days INTEGER[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(week_start)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_duties_date ON duties(date);
CREATE INDEX IF NOT EXISTS idx_duties_user_id ON duties(user_id);
CREATE INDEX IF NOT EXISTS idx_absences_dates ON absences(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_absences_user_id ON absences(user_id);

-- Sample data
INSERT INTO users (name, email) VALUES 
('Petrov I.', 'petrov@company.com'),
('Sidorova M.', 'sidorova@company.com'),
('Kozlov A.', 'kozlov@company.com'),
('Novikova E.', 'novikova@company.com'),
('Volkov D.', 'volkov@company.com'),
('Belova O.', 'belova@company.com'),
('Morozov S.', 'morozov@company.com'),
('Lebedev A.', 'lebedev@company.com'),
('Sokolova N.', 'sokolova@company.com'),
('Orlov V.', 'orlov@company.com')
ON CONFLICT (email) DO NOTHING;