class ApiService {
    // Auto-detect base URL based on environment
    static get baseUrl() {
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        // For Docker environment - use the same host as frontend
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '192.168.47.128') {
            // Use relative path for nginx proxy
            return '/api';
        } else {
            // Docker or production - use relative path
            return '/api';
        }
    }

    static async handleRequest(requestFunc) {
        try {
            return await requestFunc();
        } catch (error) {
            console.error('API Request failed:', error);
            // Отложим показ уведомлений до тех пор, пока NotificationManager не будет доступен
            if (window.NotificationManager) {
                if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                    window.NotificationManager.show('Ошибка соединения с сервером', 'error');
                } else if (error.message.includes('404')) {
                    window.NotificationManager.show('Ресурс не найден', 'error');
                } else if (error.message.includes('500') || error.message.includes('502')) {
                    window.NotificationManager.show('Ошибка сервера', 'error');
                } else {
                    window.NotificationManager.show(error.message, 'error');
                }
            }
            throw error;
        }
    }

    static async get(url) {
        return this.handleRequest(async () => {
            const fullUrl = `${this.baseUrl}${url}`;
            console.log(`API GET: ${fullUrl}`);
            
            const response = await fetch(fullUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        });
    }

    static async post(url, data) {
        return this.handleRequest(async () => {
            const fullUrl = `${this.baseUrl}${url}`;
            console.log(`API POST: ${fullUrl}`, data);
            
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        });
    }

    static async put(url, data) {
        return this.handleRequest(async () => {
            const fullUrl = `${this.baseUrl}${url}`;
            console.log(`API PUT: ${fullUrl}`, data);
            
            const response = await fetch(fullUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        });
    }

    static async delete(url) {
        return this.handleRequest(async () => {
            const fullUrl = `${this.baseUrl}${url}`;
            console.log(`API DELETE: ${fullUrl}`);
            
            const response = await fetch(fullUrl, { method: 'DELETE' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        });
    }

    // Users
    static async getUsers() {
        return this.get('/users');
    }

    static async createUser(userData) {
        return this.post('/users', userData);
    }

    // Duties
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

    // Absences
    static async getAbsences() {
        return this.get('/absences');
    }

    static async createAbsence(absenceData) {
        return this.post('/absences', absenceData);
    }

    static async deleteAbsence(id) {
        return this.delete(`/absences/${id}`);
    }

    // Week Settings
    static async getWeekSettings(weekStart) {
        return this.get(`/week-settings/${weekStart}`);
    }

    static async saveWeekSettings(weekStart, workDays) {
        return this.post('/week-settings', { weekStart, workDays });
    }

    // Health check
    static async healthCheck() {
        return this.get('/health');
    }
}

window.ApiService = ApiService;