const db = require('../database');

class User {
    static async getAll() {
        try {
            const result = await db.query(`
                SELECT * FROM users 
                ORDER BY name
            `);
            return result.rows;
        } catch (error) {
            console.error('Error in User.getAll:', error);
            throw error;
        }
    }

    static async create(userData) {
        const { name, email } = userData;
        
        try {
            const result = await db.query(
                `INSERT INTO users (name, email) 
                 VALUES ($1, $2) 
                 RETURNING *`,
                [name, email]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error in User.create:', error);
            
            // Handle duplicate email
            if (error.code === '23505') {
                throw new Error('User with this email already exists');
            }
            throw error;
        }
    }

    static async getById(id) {
        try {
            const result = await db.query(
                'SELECT * FROM users WHERE id = $1',
                [id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error in User.getById:', error);
            throw error;
        }
    }

    static async update(id, userData) {
        const { name, email } = userData;
        
        try {
            const result = await db.query(
                `UPDATE users 
                 SET name = $1, email = $2 
                 WHERE id = $3 
                 RETURNING *`,
                [name, email, id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error in User.update:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            // Сначала удаляем связанные дежурства
            await db.query('DELETE FROM duties WHERE user_id = $1', [id]);
            // Затем удаляем связанные отсутствия
            await db.query('DELETE FROM absences WHERE user_id = $1', [id]);
            // Затем удаляем пользователя
            const result = await db.query(
                'DELETE FROM users WHERE id = $1 RETURNING *',
                [id]
            );
            
            if (result.rows.length === 0) {
                throw new Error('User not found');
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('Error in User.delete:', error);
            throw error;
        }
    }
}

module.exports = User;