const { Pool } = require('pg');

class Database {
    constructor() {
        this.pool = null;
        this.init();
    }

    init() {
        try {
            this.pool = new Pool({
                user: process.env.DB_USER || 'postgres',
                host: process.env.DB_HOST || 'localhost',
                database: process.env.DB_NAME || 'duty_planner',
                password: process.env.DB_PASSWORD || 'password',
                port: process.env.DB_PORT || 5432,
                // Docker and production settings
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 10000,
            });

            this.setupEventListeners();
            this.testConnection();
            
        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    }

    setupEventListeners() {
        this.pool.on('connect', (client) => {
            console.log('? New database connection established');
        });

        this.pool.on('error', (err, client) => {
            console.error('? Database connection error:', err);
        });

        this.pool.on('remove', (client) => {
            console.log('?? Database connection removed');
        });
    }

    async testConnection() {
        try {
            const client = await this.pool.connect();
            console.log('? Database connection test successful');
            
            const tables = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `);
            
            console.log('?? Available tables:', tables.rows.map(row => row.table_name));
            
            client.release();
        } catch (error) {
            console.error('? Database connection test failed:', error.message);
            
            // Retry after 5 seconds
            setTimeout(() => {
                console.log('?? Retrying database connection...');
                this.testConnection();
            }, 5000);
        }
    }

    async query(text, params) {
        const start = Date.now();
        
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            console.log('?? Executed query:', { 
                text, 
                duration: `${duration}ms`,
                rows: result.rowCount 
            });
            
            return result;
        } catch (error) {
            const duration = Date.now() - start;
            console.error('? Query error:', {
                text,
                params,
                duration: `${duration}ms`,
                error: error.message
            });
            throw error;
        }
    }

    async connect() {
        return await this.pool.connect();
    }

    async healthCheck() {
        try {
            const result = await this.query('SELECT NOW() as current_time');
            return {
                status: 'healthy',
                database: 'connected',
                timestamp: result.rows[0].current_time
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                database: 'disconnected',
                error: error.message
            };
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('?? Database pool closed');
        }
    }
}

// Create and export database instance
const database = new Database();

// Export methods for use in models
module.exports = {
    query: (text, params) => database.query(text, params),
    connect: () => database.connect(),
    healthCheck: () => database.healthCheck(),
    close: () => database.close()
};