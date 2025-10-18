const db = require('../database');

class Duty {
    static async getByWeek(startDate, endDate) {
        try {
            const result = await db.query(
                `SELECT d.*, u.name as user_name 
                 FROM duties d 
                 LEFT JOIN users u ON d.user_id = u.id 
                 WHERE d.date BETWEEN $1 AND $2 
                 ORDER BY d.date, d.hour`,
                [startDate, endDate]
            );
            return result.rows;
        } catch (error) {
            console.error('Error in Duty.getByWeek:', error);
            throw error;
        }
    }

    static async create(dutyData) {
        const { date, hour, userId, customName } = dutyData;
        
        try {
            // Check if duty already exists for this time
            const existing = await db.query(
                'SELECT id FROM duties WHERE date = $1 AND hour = $2',
                [date, hour]
            );

            if (existing.rows.length > 0) {
                // Update existing duty
                return await this.update(existing.rows[0].id, { userId, customName });
            }

            // Create new duty
            const result = await db.query(
                `INSERT INTO duties (date, hour, user_id, custom_name) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING *`,
                [date, hour, userId, customName]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error in Duty.create:', error);
            throw error;
        }
    }

    static async update(id, dutyData) {
        const { userId, customName } = dutyData;
        
        try {
            const result = await db.query(
                `UPDATE duties 
                 SET user_id = $1, custom_name = $2 
                 WHERE id = $3 
                 RETURNING *`,
                [userId, customName, id]
            );
            
            if (result.rows.length === 0) {
                throw new Error('Duty not found');
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('Error in Duty.update:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const result = await db.query(
                'DELETE FROM duties WHERE id = $1 RETURNING *',
                [id]
            );
            
            if (result.rows.length === 0) {
                throw new Error('Duty not found');
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('Error in Duty.delete:', error);
            throw error;
        }
    }

    static async deleteByWeek(startDate, endDate) {
        try {
            const result = await db.query(
                'DELETE FROM duties WHERE date BETWEEN $1 AND $2 RETURNING *',
                [startDate, endDate]
            );
            return result.rows;
        } catch (error) {
            console.error('Error in Duty.deleteByWeek:', error);
            throw error;
        }
    }

    static async getStatistics(startDate, endDate) {
        try {
            const result = await db.query(`
                SELECT 
                    u.id,
                    u.name,
                    COUNT(d.id) as duty_count,
                    SUM(CASE WHEN d.date BETWEEN $1 AND $2 THEN 1 ELSE 0 END) as period_duty_count
                FROM users u
                LEFT JOIN duties d ON u.id = d.user_id
                GROUP BY u.id, u.name
                ORDER BY duty_count DESC
            `, [startDate, endDate]);
            
            return result.rows;
        } catch (error) {
            console.error('Error in Duty.getStatistics:', error);
            throw error;
        }
    }
}

module.exports = Duty;