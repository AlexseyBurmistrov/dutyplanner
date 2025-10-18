const db = require('../database');

class Absence {
    static async getAll() {
        try {
            const result = await db.query(`
                SELECT a.*, u.name as user_name 
                FROM absences a 
                JOIN users u ON a.user_id = u.id 
                ORDER BY a.start_date DESC
            `);
            return result.rows;
        } catch (error) {
            console.error('Error in Absence.getAll:', error);
            throw error;
        }
    }

    static async create(absenceData) {
        const { userId, startDate, endDate, reason } = absenceData;
        
        try {
            // Validate dates
            if (new Date(startDate) > new Date(endDate)) {
                throw new Error('Start date cannot be after end date');
            }

            const result = await db.query(
                `INSERT INTO absences (user_id, start_date, end_date, reason) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING *`,
                [userId, startDate, endDate, reason]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error in Absence.create:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const result = await db.query(
                'DELETE FROM absences WHERE id = $1 RETURNING *',
                [id]
            );
            
            if (result.rows.length === 0) {
                throw new Error('Absence not found');
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('Error in Absence.delete:', error);
            throw error;
        }
    }

    static async getByUserAndDate(userId, date) {
        try {
            const result = await db.query(
                `SELECT * FROM absences 
                 WHERE user_id = $1 AND $2 BETWEEN start_date AND end_date`,
                [userId, date]
            );
            return result.rows;
        } catch (error) {
            console.error('Error in Absence.getByUserAndDate:', error);
            throw error;
        }
    }
}

module.exports = Absence;