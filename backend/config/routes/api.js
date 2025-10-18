class ApiService {
    // Auto-detect base URL based on environment
    static get baseUrl() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // Local development
            return `${protocol}//localhost:3000/api`;
        } else {
            // Docker or production - use relative path
            return '/api';
        }
    }

    static async request(url, options = {}) {
        const startTime = Date.now();
        
        try {
            const fullUrl = `${this.baseUrl}${url}`;
            
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            const mergedOptions = { ...defaultOptions, ...options };
            
            console.log(`?? API Request: ${mergedOptions.method || 'GET'} ${url}`);
            
            const response = await fetch(fullUrl, mergedOptions);
            const duration = Date.now() - startTime;
            
            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // If cannot parse JSON error
                }
                
                console.error(`? API Error [${duration}ms]:`, errorMessage);
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            
            console.log(`? API Success [${duration}ms]: ${url}`);
            
            return data;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`?? API Request Failed [${duration}ms]:`, error.message);
            
            // Show user-friendly error message
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Cannot connect to server. Please check your internet connection.');
            }
            
            throw error;
        }
    }

    static async get(url) {
        return this.request(url, { method: 'GET' });
    }

    static async post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async put(url, data) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    static async delete(url) {
        return this.request(url, { method: 'DELETE' });
    }

    // Health check
    static async healthCheck() {
        return this.get('/health');
    }

    // Users API
    static async getUsers() {
        return this.get('/users');
    }

    static async createUser(userData) {
        return this.post('/users', userData);
    }

    // Duties API
    static async getDutiesForWeek(startDate, endDate) {
        return this.get(`/duties/week/${startDate}/${endDate}`);
    }

    static async createDuty(dutyData) {
        return this.post('/duties', dutyData);
    }

    static async updateDuty(id, dutyData) {
        return this.put(`/duties/${id}`, dutyData);
    }

    static async deleteDuty(id) {
        return this.delete(`/duties/${id}`);
    }

    static async clearWeekDuties(startDate, endDate) {
        return this.delete(`/duties/week/${startDate}/${endDate}`);
    }

    static async getStatistics(startDate, endDate) {
        return this.get(`/duties/statistics/${startDate}/${endDate}`);
    }

    // Absences API
    static async getAbsences() {
        return this.get('/absences');
    }

    static async createAbsence(absenceData) {
        return this.post('/absences', absenceData);
    }

    static async deleteAbsence(id) {
        return this.delete(`/absences/${id}`);
    }

    // Week Settings API
    static async getWeekSettings(weekStart) {
        return this.get(`/week-settings/${weekStart}`);
    }

    static async saveWeekSettings(weekStart, workDays) {
        return this.post('/week-settings', { weekStart, workDays });
    }
}