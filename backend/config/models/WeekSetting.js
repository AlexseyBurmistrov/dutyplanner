const db = require('../database');

class WeekSetting {
    static async getByWeekStart(weekStart) {
        try {
            const result = await db.query(
                'SELECT * FROM week_settings WHERE week_start = $1',
                [weekStart]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error in WeekSetting.getByWeekStart:', error);
            throw error;
        }
    }

    static async createOrUpdate(weekStart, workDays) {
        try {
            // Check for existing record
            const existing = await this.getByWeekStart(weekStart);
            
            if (existing) {
                // Update existing record
                const result = await db.query(
                    `UPDATE week_settings 
                     SET work_days = $1 
                     WHERE week_start = $2 
                     RETURNING *`,
                    [workDays, weekStart]
                );
                return result.rows[0];
            } else {
                // Create new record
                const result = await db.query(
                    `INSERT INTO week_settings (week_start, work_days) 
                     VALUES ($1, $2) 
                     RETURNING *`,
                    [weekStart, workDays]
                );
                return result.rows[0];
            }
        } catch (error) {
            console.error('Error in WeekSetting.createOrUpdate:', error);
            throw error;
        }
    }

    static async getDefaultWorkDays() {
        return [1, 2, 3, 4, 5]; // Mon-Fri by default
    }
}

module.exports = WeekSetting;