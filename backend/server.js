const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'API is working!', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Routes 
app.use('/api/users', require('./config/routes/users'));
app.use('/api/duties', require('./config/routes/duties'));
app.use('/api/absences', require('./config/routes/absences'));
app.use('/api/week-settings', require('./config/routes/weekSettings'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const db = require('./database');
        const dbHealth = await db.healthCheck();
        
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            database: dbHealth.status,
            environment: process.env.NODE_ENV,
            version: '1.0.0'
        });
    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: error.message,
            version: '1.0.0'
        });
    }
});

// Root endpoint
app.get('/api', (req, res) => {
    res.json({
        message: 'Duty Planner API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            users: '/api/users',
            duties: '/api/duties',
            absences: '/api/absences',
            weekSettings: '/api/week-settings',
            health: '/api/health',
            test: '/api/test'
        },
        documentation: 'See /api/health for system status'
    });
});

// Demo data endpoint for testing
app.get('/api/demo/users', (req, res) => {
    const demoUsers = [
        { id: 1, name: "Петров Иван", email: "petrov@company.com" },
        { id: 2, name: "Сидорова Мария", email: "sidorova@company.com" },
        { id: 3, name: "Козлов Алексей", email: "kozlov@company.com" },
        { id: 4, name: "Новикова Елена", email: "novikova@company.com" },
        { id: 5, name: "Волков Дмитрий", email: "volkov@company.com" }
    ];
    res.json(demoUsers);
});

app.get('/api/demo/duties', (req, res) => {
    const today = new Date();
    const demoDuties = [
        {
            id: 1,
            date: today.toISOString().split('T')[0],
            hour: 9,
            user_id: 1,
            user_name: "Петров Иван"
        },
        {
            id: 2,
            date: today.toISOString().split('T')[0],
            hour: 10,
            user_id: 2,
            user_name: "Сидорова Мария"
        }
    ];
    res.json(demoDuties);
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
        availableEndpoints: [
            '/api/users',
            '/api/duties',
            '/api/absences',
            '/api/week-settings',
            '/api/health',
            '/api/test',
            '/api/demo/users',
            '/api/demo/duties'
        ]
    });
});

// Catch-all handler for non-API routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
        note: 'This is an API server. Use /api endpoints.'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`?? Server is running on port ${PORT}`);
    console.log(`?? Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`?? Host: 0.0.0.0`);
    console.log(`?? Health check: http://localhost:${PORT}/api/health`);
    console.log(`?? Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`?? API documentation: http://localhost:${PORT}/api`);
    console.log(`?? Demo data: http://localhost:${PORT}/api/demo/users`);
    
    // Log database connection info
    console.log(`???  Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    try {
        const db = require('./database');
        await db.close();
    } catch (error) {
        console.error('Error closing database:', error);
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    try {
        const db = require('./database');
        await db.close();
    } catch (error) {
        console.error('Error closing database:', error);
    }
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});