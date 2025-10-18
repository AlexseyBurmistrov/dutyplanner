class DutyPlannerApp {
    constructor() {
        this.currentWeekRange = this.getWeekRange();
        this.selectedDate = new Date();
        this.users = [];
        this.duties = [];
        this.absences = [];
        this.allDuties = [];
        this.settings = {
            dutyStart: 7,
            dutyEnd: 18,
            dutyDuration: 1
        };
        this.currentWorkDays = [1, 2, 3, 4, 5];
        this.currentDuty = null;
        
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.renderGrid();
        this.renderUsersTable();
        this.renderAbsencesTable();
        this.renderStatistics();
        this.renderCurrentAbsences();
        this.startClock();
        this.updateCurrentDuty();
        
        setInterval(() => {
            this.updateCurrentDuty();
        }, 60000);
    }
    
    async loadData() {
        try {
            console.log('������ Loading data from API...');
            
            this.users = await this.apiCall('/users') || [];
            console.log('✅ Users loaded:', this.users.length);
            
            const duties = await this.apiCall(`/duties/week/${this.currentWeekRange.start}/${this.currentWeekRange.end}`) || [];
            this.duties = duties;
            console.log('✅ Duties loaded:', this.duties.length);
            
            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);
            
            this.allDuties = await this.apiCall(`/duties/week/${this.formatDate(startDate)}/${this.formatDate(endDate)}`) || [];
            console.log('✅ All duties loaded:', this.allDuties.length);
            
            this.absences = await this.apiCall('/absences') || [];
            console.log('✅ Absences loaded:', this.absences.length);
            
            const weekSettings = await this.apiCall(`/week-settings/${this.currentWeekRange.start}`);
            if (weekSettings && weekSettings.work_days) {
                this.currentWorkDays = Array.isArray(weekSettings.work_days) ? 
                    weekSettings.work_days : [1, 2, 3, 4, 5];
            }
            
            console.log('✅ All data loaded successfully from API');
            
        } catch (error) {
            console.error('❌ Error loading data from API:', error);
            
            if (this.users.length === 0) {
                this.users = this.generateTestUsers();
                console.log('������ Using test users:', this.users.length);
            }
            if (this.duties.length === 0) {
                this.duties = [];
            }
            if (this.absences.length === 0) {
                this.absences = this.generateTestAbsences();
            }
            if (this.allDuties.length === 0) {
                this.allDuties = [];
            }
            
            console.log('✅ Fallback to test data completed');
        }
    }
    
    generateTestUsers() {
        return [
            { id: 1, name: "Петров Иван", email: "petrov@company.com" },
            { id: 2, name: "Сидорова Мария", email: "sidorova@company.com" },
            { id: 3, name: "Козлов Алексей", email: "kozlov@company.com" },
            { id: 4, name: "Новикова Елена", email: "novikova@company.com" },
            { id: 5, name: "Волков Дмитрий", email: "volkov@company.com" }
        ];
    }
    
    generateTestAbsences() {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        
        return [
            {
                id: 1,
                user_id: 2,
                start_date: this.formatDate(today),
                end_date: this.formatDate(nextWeek),
                reason: "отпуск"
            }
        ];
    }
    
    async apiCall(endpoint, options = {}) {
        try {
            const baseUrl = '/api';
            
            console.log(`������ API Call: ${baseUrl}${endpoint}`, options);
            
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
                ...options
            };
            
            if (options.body) {
                config.body = options.body;
            }
            
            const response = await fetch(`${baseUrl}${endpoint}`, config);
            
            console.log(`������ API Response: ${response.status} for ${endpoint}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`❌ API call failed: ${endpoint}`, error);
            throw error;
        }
    }
    
    getWeekRange(date = new Date()) {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        
        return {
            start: this.formatDate(start),
            end: this.formatDate(end),
            startDate: start,
            endDate: end
        };
    }
    
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    formatTime(hour) {
        return `${hour.toString().padStart(2, '0')}:00`;
    }
    
    getDayName(dayIndex) {
        const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        return days[dayIndex];
    }
    
    getFullDayName(dayIndex) {
        const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        return days[dayIndex];
    }
    
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }
    
    isWorkDay(date) {
        const dayOfWeek = date.getDay();
        return this.currentWorkDays.includes(dayOfWeek);
    }
    
    isDateInCurrentWeek(date) {
        const weekStart = new Date(this.currentWeekRange.startDate);
        const weekEnd = new Date(this.currentWeekRange.endDate);
        return date >= weekStart && date <= weekEnd;
    }
    
    renderGrid() {
        const grid = document.getElementById('dutyGrid');
        grid.innerHTML = '';
        
        this.renderGridHeaders();
        this.renderGridBody();
        this.renderMiniCalendar();
        this.updateWeekInfo();
        this.updateWeekStatistics();
    }
    
    renderGridHeaders() {
        const grid = document.getElementById('dutyGrid');
        let html = '<div class="grid-header time-header">Время</div>';
        
        const startDate = new Date(this.currentWeekRange.startDate);
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const isWorkDay = this.isWorkDay(date);
            const isToday = this.isToday(date);
            const isSelected = this.formatDate(date) === this.formatDate(this.selectedDate);
            
            let headerClass = 'grid-header day-header';
            if (!isWorkDay) headerClass += ' weekend';
            if (isToday) headerClass += ' today';
            if (isSelected) headerClass += ' selected-day';
            
            html += `
                <div class="${headerClass}" data-date="${this.formatDate(date)}">
                    <div>${this.getDayName(date.getDay())}</div>
                    <div><small>${date.getDate()}.${date.getMonth() + 1}</small></div>
                    ${isToday ? '<div class="today-badge">Сегодня</div>' : ''}
                    ${isSelected ? '<div class="selected-badge">Выбран</div>' : ''}
                    ${!isWorkDay ? '<div class="non-working-badge">❌</div>' : ''}
                </div>
            `;
        }
        
        grid.innerHTML += html;
    }
    
    renderGridBody() {
        const grid = document.getElementById('dutyGrid');
        const startDate = new Date(this.currentWeekRange.startDate);
        
        let bodyHTML = '';
        
        for (let hour = this.settings.dutyStart; hour < this.settings.dutyEnd; hour += this.settings.dutyDuration) {
            bodyHTML += `<div class="time-slot">${this.formatTime(hour)}</div>`;
            
            for (let i = 0; i < 7; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                const dateStr = this.formatDate(date);
                const isWorkDay = this.isWorkDay(date);
                
                // ИСПРАВЛЕННЫЙ ПОИСК - нормализуем даты и часы
                const duty = this.duties.find(d => {
                    const dutyDateNormalized = d.date.split('T')[0];
                    const dutyHour = parseInt(d.hour);
                    return dutyDateNormalized === dateStr && dutyHour === hour;
                });
                
                bodyHTML += this.renderDutyCell(dateStr, hour, duty, isWorkDay);
            }
        }
        
        grid.innerHTML += bodyHTML;
        this.attachGridEventListeners();
    }
    
    renderDutyCell(date, hour, duty, isWorkDay) {
        const dateObj = new Date(date);
        const isToday = this.isToday(dateObj);
        const isCurrentTime = isToday && hour === new Date().getHours();
        const isSelected = this.formatDate(dateObj) === this.formatDate(this.selectedDate);
        
        let cellClass = 'duty-cell';
        let personName = '─';
        
        if (!isWorkDay) {
            cellClass += ' non-working';
            personName = 'Выходной';
        } else if (duty) {
            cellClass += ' assigned';
            if (duty.user_id) {
                const user = this.users.find(u => u.id === duty.user_id);
                if (user) {
                    personName = user.name;
                    
                    const isAbsent = this.absences.some(absence => {
                        const absenceStart = new Date(absence.start_date);
                        const absenceEnd = new Date(absence.end_date);
                        const dutyDate = new Date(date);
                        return absence.user_id === duty.user_id && 
                               dutyDate >= absenceStart && dutyDate <= absenceEnd;
                    });
                    
                    if (isAbsent) {
                        cellClass += ' absent';
                        personName += ' ❌';
                    }
                } else {
                    personName = 'Неизвестный';
                }
            } else if (duty.custom_name) {
                personName = duty.custom_name;
            }
        } else {
            cellClass += ' empty';
        }
        
        if (isToday) cellClass += ' today';
        if (isCurrentTime) cellClass += ' current-time';
        if (isSelected) cellClass += ' selected';
        
        return `
            <div class="${cellClass}" 
                 data-date="${date}" 
                 data-hour="${hour}"
                 data-duty-id="${duty?.id || ''}">
                <div class="duty-person">${personName}</div>
            </div>
        `;
    }
    
    attachGridEventListeners() {
        document.querySelectorAll('.duty-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const isWorkDay = !cell.classList.contains('non-working');
                if (!isWorkDay) {
                    this.showNotification('Редактирование выходных дней недоступно', 'warning');
                    return;
                }
                
                const date = cell.getAttribute('data-date');
                const hour = parseInt(cell.getAttribute('data-hour'));
                const dutyId = cell.getAttribute('data-duty-id');
                
                this.openDutyModal(date, hour, dutyId);
            });
        });
    }
    
    renderMiniCalendar() {
        const calendar = document.getElementById('miniCalendar');
        const currentDate = new Date(this.currentWeekRange.startDate);
        
        let html = `
            <div class="mini-calendar">
                <div class="calendar-header">
                    ${currentDate.toLocaleDateString('ru', { month: 'long', year: 'numeric' })}
                </div>
                <div class="calendar-grid">
        `;
        
        const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        weekDays.forEach(day => {
            const isWeekend = day === 'Сб' || day === 'Вс';
            html += `<div class="calendar-weekday ${isWeekend ? 'weekend' : ''}">${day}</div>`;
        });
        
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const startDay = firstDay.getDay();
        const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;
        
        for (let i = 0; i < adjustedStartDay; i++) {
            html += '<div class="calendar-day other-month"></div>';
        }
        
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isCurrentWeek = this.isDateInCurrentWeek(date);
            const isToday = this.isToday(date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            let dayClass = 'calendar-day';
            if (isCurrentWeek) dayClass += ' current-week';
            if (isToday) dayClass += ' today';
            if (isWeekend) dayClass += ' weekend';
            
            html += `<div class="${dayClass}">${day}</div>`;
        }
        
        html += '</div></div>';
        calendar.innerHTML = html;
    }
    
    updateWeekInfo() {
        const { startDate, endDate } = this.currentWeekRange;
        const rangeText = `${startDate.getDate()}.${startDate.getMonth() + 1} - ${endDate.getDate()}.${endDate.getMonth() + 1}.${endDate.getFullYear()}`;
        document.getElementById('currentWeekRange').textContent = rangeText;
        
        const workDaysText = `${this.currentWorkDays.length} рабочих дней`;
        document.getElementById('workDaysInfo').textContent = workDaysText;
    }
    
    updateWeekStatistics() {
        const workDaysCount = this.currentWorkDays.length;
        const totalSlots = workDaysCount * ((this.settings.dutyEnd - this.settings.dutyStart) / this.settings.dutyDuration);
        
        const assigned = this.duties.filter(d => d.user_id || d.custom_name).length;
        const empty = totalSlots - assigned;
        
        const absent = this.duties.filter(duty => {
            if (!duty.user_id) return false;
            
            return this.absences.some(absence => {
                const absenceStart = new Date(absence.start_date);
                const absenceEnd = new Date(absence.end_date);
                const dutyDate = new Date(duty.date);
                return absence.user_id === duty.user_id && 
                       dutyDate >= absenceStart && dutyDate <= absenceEnd;
            });
        }).length;
        
        const activeUsers = this.users.filter(user => {
            return !this.absences.some(absence => {
                const absenceStart = new Date(absence.start_date);
                const absenceEnd = new Date(absence.end_date);
                const today = new Date();
                return absence.user_id === user.id && 
                       today >= absenceStart && today <= absenceEnd;
            });
        }).length;
        
        const averagePerUser = activeUsers > 0 ? (assigned / activeUsers).toFixed(1) : 0;
        
        document.getElementById('weekAssigned').textContent = assigned;
        document.getElementById('weekEmpty').textContent = empty;
        document.getElementById('weekAbsent').textContent = absent;
        document.getElementById('weekTotal').textContent = totalSlots;
        document.getElementById('weekAverage').textContent = averagePerUser;
    }
    
    renderCurrentAbsences() {
        const container = document.getElementById('currentAbsencesList');
        container.innerHTML = '';
        
        const today = new Date();
        const currentAbsences = this.absences.filter(absence => {
            const startDate = new Date(absence.start_date);
            const endDate = new Date(absence.end_date);
            return today >= startDate && today <= endDate;
        });
        
        if (currentAbsences.length === 0) {
            container.innerHTML = '<div class="text-center text-muted small">Нет текущих отсутствий</div>';
            return;
        }
        
        currentAbsences.forEach(absence => {
            const user = this.users.find(u => u.id === absence.user_id);
            if (!user) return;
            
            const startDate = new Date(absence.start_date);
            const endDate = new Date(absence.end_date);
            const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            
            const item = document.createElement('div');
            item.className = 'absence-item mb-2 p-2 border rounded';
            item.innerHTML = `
                <div class="fw-bold small">${user.name}</div>
                <div class="small text-muted">${absence.reason}</div>
                <div class="small">до ${endDate.getDate()}.${endDate.getMonth() + 1} (${daysLeft} д.)</div>
            `;
            container.appendChild(item);
        });
    }
    
    updateCurrentDuty() {
        const now = new Date();
        const currentHour = now.getHours();
        const today = this.formatDate(now);
        
        if (!this.isWorkDay(now)) {
            this.displayCurrentDuty(null, true);
            return;
        }
        
        const currentDuty = this.duties.find(duty => {
            const dutyDateNormalized = duty.date.split('T')[0];
            return dutyDateNormalized === today && parseInt(duty.hour) === currentHour;
        });
        
        this.displayCurrentDuty(currentDuty, false);
    }
    
    displayCurrentDuty(duty, isDayOff) {
        const personEl = document.getElementById('currentDutyPerson');
        const timeEl = document.getElementById('currentDutyTime');
        const periodEl = document.getElementById('currentDutyPeriod');
        
        if (isDayOff) {
            personEl.textContent = 'Выходной';
            personEl.className = 'h5 mb-2 text-secondary';
            timeEl.textContent = 'Сегодня не рабочий день';
            periodEl.textContent = '';
            return;
        }
        
        if (duty) {
            let personName = 'Не назначено';
            
            if (duty.user_id) {
                const user = this.users.find(u => u.id === duty.user_id);
                personName = user ? user.name : 'Неизвестный';
            } else if (duty.custom_name) {
                personName = duty.custom_name;
            }
            
            personEl.textContent = personName;
            personEl.className = 'h5 mb-2 text-success current-duty-pulse';
            
            const nextHour = parseInt(duty.hour) + this.settings.dutyDuration;
            timeEl.textContent = `Сейчас дежурство`;
            periodEl.textContent = `${duty.hour}:00 - ${nextHour}:00`;
        } else {
            personEl.textContent = 'Не назначено';
            personEl.className = 'h5 mb-2 text-danger';
            timeEl.textContent = 'Нет дежурного';
            periodEl.textContent = `Текущее время: ${new Date().getHours()}:00`;
        }
    }
    
    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';
        
        this.users.forEach(user => {
            const dutiesCount = this.allDuties.filter(d => d.user_id === user.id).length;
            const weekDutiesCount = this.duties.filter(d => d.user_id === user.id).length;
            
            const isAbsent = this.absences.some(absence => {
                const absenceStart = new Date(absence.start_date);
                const absenceEnd = new Date(absence.end_date);
                const today = new Date();
                return absence.user_id === user.id && 
                       today >= absenceStart && today <= absenceEnd;
            });
            
            const status = isAbsent ? 
                '<span class="badge bg-danger">Отсутствует</span>' :
                '<span class="badge bg-success">Активен</span>';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td class="text-center">${weekDutiesCount}</td>
                <td>${status}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="app.deleteUser(${user.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    async deleteUser(userId) {
        if (!confirm('Вы уверены, что хотите удалить этого сотрудника? Все его дежурства и записи об отсутствиях также будут удалены.')) {
            return;
        }
        
        try {
            await this.apiCall(`/users/${userId}`, { method: 'DELETE' });
            this.showNotification('Сотрудник удален', 'success');
            await this.loadData();
            this.renderUsersTable();
            this.renderStatistics();
            this.renderCurrentAbsences();
            this.renderGrid();
        } catch (error) {
            this.showNotification('Ошибка удаления сотрудника', 'error');
        }
    }
    
    renderAbsencesTable() {
        const tbody = document.getElementById('absencesTableBody');
        tbody.innerHTML = '';
        
        this.absences.forEach(absence => {
            const user = this.users.find(u => u.id === absence.user_id);
            if (!user) return;
            
            const startDate = new Date(absence.start_date);
            const endDate = new Date(absence.end_date);
            const daysCount = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${startDate.toLocaleDateString('ru')} - ${endDate.toLocaleDateString('ru')}</td>
                <td class="text-center">${daysCount}</td>
                <td>${absence.reason}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="app.deleteAbsence(${absence.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    async deleteAbsence(absenceId) {
        if (!confirm('Вы уверены, что хотите удалить эту запись об отсутствии?')) {
            return;
        }
        
        try {
            await this.apiCall(`/absences/${absenceId}`, { method: 'DELETE' });
            this.showNotification('Отсутствие удалено', 'success');
            await this.loadData();
            this.renderAbsencesTable();
            this.renderCurrentAbsences();
            this.renderGrid();
            this.renderStatistics();
        } catch (error) {
            this.showNotification('Ошибка удаления отсутствия', 'error');
        }
    }
    
    renderStatistics() {
        this.renderStatisticsTable();
        this.renderGeneralStatistics();
    }
    
    renderStatisticsTable() {
        const tbody = document.getElementById('statisticsTableBody');
        tbody.innerHTML = '';
        
        this.users.forEach(user => {
            const weekDutiesCount = this.duties.filter(d => d.user_id === user.id).length;
            const totalDutiesCount = this.allDuties.filter(d => d.user_id === user.id).length;
            
            const isAbsent = this.absences.some(absence => {
                const absenceStart = new Date(absence.start_date);
                const absenceEnd = new Date(absence.end_date);
                const today = new Date();
                return absence.user_id === user.id && 
                       today >= absenceStart && today <= absenceEnd;
            });
            
            const status = isAbsent ? 
                '<span class="badge bg-danger">Отсутствует</span>' :
                '<span class="badge bg-success">Активен</span>';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td class="text-center">${weekDutiesCount}</td>
                <td class="text-center">${totalDutiesCount}</td>
                <td class="text-center">${totalDutiesCount > 0 ? (totalDutiesCount / 4).toFixed(1) : 0}</td>
                <td class="text-center">${status}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    renderGeneralStatistics() {
        const activeUsers = this.users.filter(user => {
            return !this.absences.some(absence => {
                const absenceStart = new Date(absence.start_date);
                const absenceEnd = new Date(absence.end_date);
                const today = new Date();
                return absence.user_id === user.id && 
                       today >= absenceStart && today <= absenceEnd;
            });
        }).length;
        
        const absentUsers = this.users.length - activeUsers;
        const weekDutiesCount = this.duties.filter(d => d.user_id || d.custom_name).length;
        const averagePerUser = activeUsers > 0 ? (weekDutiesCount / activeUsers).toFixed(1) : 0;
        
        document.getElementById('totalUsers').textContent = this.users.length;
        document.getElementById('activeUsers').textContent = activeUsers;
        document.getElementById('absentUsers').textContent = absentUsers;
        document.getElementById('totalDutiesWeek').textContent = weekDutiesCount;
        document.getElementById('averagePerUser').textContent = averagePerUser;
    }
    
    openDutyModal(date, hour, dutyId = '') {
        const modal = new bootstrap.Modal(document.getElementById('dutyModal'));
        const dateObj = new Date(date);
        
        document.getElementById('dutyDateTime').value = 
            `${dateObj.toLocaleDateString('ru')} ${this.formatTime(hour)}`;
        document.getElementById('dutyDateTime').dataset.date = date;
        document.getElementById('dutyDateTime').dataset.hour = hour;
        document.getElementById('dutyDateTime').dataset.dutyId = dutyId;
        
        this.populateUserSelect();
        modal.show();
    }
    
    populateUserSelect() {
        const select = document.getElementById('dutyUser');
        select.innerHTML = '<option value="">-- Выберите сотрудника --</option>';
        
        const activeUsers = this.users.filter(user => {
            return !this.absences.some(absence => {
                const absenceStart = new Date(absence.start_date);
                const absenceEnd = new Date(absence.end_date);
                const dutyDate = new Date(document.getElementById('dutyDateTime').dataset.date);
                return absence.user_id === user.id && 
                       dutyDate >= absenceStart && dutyDate <= absenceEnd;
            });
        });
        
        activeUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            select.appendChild(option);
        });
        
        const dutyId = document.getElementById('dutyDateTime').dataset.dutyId;
        if (dutyId) {
            const duty = this.duties.find(d => d.id == dutyId);
            if (duty && duty.user_id) {
                select.value = duty.user_id;
            }
        }
    }
    
    async saveDuty() {
        const date = document.getElementById('dutyDateTime').dataset.date;
        const hour = parseInt(document.getElementById('dutyDateTime').dataset.hour);
        const dutyId = document.getElementById('dutyDateTime').dataset.dutyId;
        const userId = document.getElementById('dutyUser').value;
        
        const dutyData = {
            date: date,
            hour: hour,
            userId: userId && userId !== '' ? parseInt(userId) : null,
            user_id: userId && userId !== '' ? parseInt(userId) : null,
            customName: '',
            custom_name: ''
        };
        
        try {
            let response;
            if (dutyId) {
                response = await this.apiCall(`/duties/${dutyId}`, {
                    method: 'PUT',
                    body: JSON.stringify(dutyData)
                });
            } else {
                response = await this.apiCall('/duties', {
                    method: 'POST',
                    body: JSON.stringify(dutyData)
                });
            }
            
            this.showNotification('Дежурство сохранено', 'success');
            bootstrap.Modal.getInstance(document.getElementById('dutyModal')).hide();
            await this.loadData();
            this.renderGrid();
            this.renderStatistics();
            this.updateCurrentDuty();
        } catch (error) {
            this.showNotification('Ошибка сохранения дежурства', 'error');
        }
    }
    
    async clearDutySlot() {
        const dutyId = document.getElementById('dutyDateTime').dataset.dutyId;
        
        if (dutyId) {
            try {
                await this.apiCall(`/duties/${dutyId}`, { method: 'DELETE' });
                this.showNotification('Дежурство очищено', 'success');
                bootstrap.Modal.getInstance(document.getElementById('dutyModal')).hide();
                await this.loadData();
                this.renderGrid();
                this.renderStatistics();
                this.updateCurrentDuty();
            } catch (error) {
                this.showNotification('Ошибка очистки дежурства', 'error');
            }
        } else {
            bootstrap.Modal.getInstance(document.getElementById('dutyModal')).hide();
        }
    }
    
    openAddUserModal() {
        const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
        document.getElementById('userName').value = '';
        document.getElementById('userEmail').value = '';
        modal.show();
    }
    
    async saveUser() {
        const name = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        
        if (!name || !email) {
            this.showNotification('Заполните все поля', 'warning');
            return;
        }
        
        try {
            await this.apiCall('/users', {
                method: 'POST',
                body: JSON.stringify({ name, email })
            });
            
            this.showNotification('Сотрудник добавлен', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
            
            await this.loadData();
            this.renderUsersTable();
            this.renderStatistics();
            this.renderCurrentAbsences();
        } catch (error) {
            this.showNotification('Ошибка добавления сотрудника', 'error');
        }
    }
    
    openAddAbsenceModal() {
        const modal = new bootstrap.Modal(document.getElementById('addAbsenceModal'));
        
        const select = document.getElementById('absenceUser');
        select.innerHTML = '<option value="">-- Выберите сотрудника --</option>';
        this.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            select.appendChild(option);
        });
        
        const today = this.formatDate(new Date());
        document.getElementById('absenceStart').value = today;
        document.getElementById('absenceEnd').value = today;
        document.getElementById('absenceReason').value = '';
        
        modal.show();
    }
    
    async saveAbsence() {
        const userId = document.getElementById('absenceUser').value;
        const startDate = document.getElementById('absenceStart').value;
        const endDate = document.getElementById('absenceEnd').value;
        const reason = document.getElementById('absenceReason').value;
        
        if (!userId || !startDate || !endDate || !reason) {
            this.showNotification('Заполните все поля', 'warning');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            this.showNotification('Дата начала не может быть позже даты окончания', 'warning');
            return;
        }
        
        const absenceData = { 
            userId: parseInt(userId), 
            startDate: startDate, 
            endDate: endDate, 
            reason: reason
        };
        
        try {
            const response = await this.apiCall('/absences', {
                method: 'POST',
                body: JSON.stringify(absenceData)
            });
            
            this.showNotification('Отсутствие добавлено', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addAbsenceModal')).hide();
            
            await this.loadData();
            this.renderAbsencesTable();
            this.renderCurrentAbsences();
            this.renderGrid();
            this.renderStatistics();
            this.updateCurrentDuty();
        } catch (error) {
            console.error('Error saving absence:', error);
            this.showNotification('Ошибка добавления отсутствия: ' + error.message, 'error');
        }
    }
    
    openSystemSettings() {
        const modal = new bootstrap.Modal(document.getElementById('systemSettingsModal'));
        
        document.getElementById('dutyStartTime').value = 
            this.settings.dutyStart.toString().padStart(2, '0') + ':00';
        document.getElementById('dutyEndTime').value = 
            this.settings.dutyEnd.toString().padStart(2, '0') + ':00';
        document.getElementById('dutyDuration').value = this.settings.dutyDuration;
        
        modal.show();
    }
    
    saveSystemSettings() {
        this.settings.dutyStart = parseInt(document.getElementById('dutyStartTime').value.split(':')[0]);
        this.settings.dutyEnd = parseInt(document.getElementById('dutyEndTime').value.split(':')[0]);
        this.settings.dutyDuration = parseInt(document.getElementById('dutyDuration').value);
        
        this.showNotification('Настройки сохранены', 'success');
        bootstrap.Modal.getInstance(document.getElementById('systemSettingsModal')).hide();
        
        this.renderGrid();
    }
    
    openWeekSettings() {
        const modal = new bootstrap.Modal(document.getElementById('weekSettingsModal'));
        this.renderWorkDaysSettings();
        modal.show();
    }
    
    renderWorkDaysSettings() {
        const container = document.getElementById('workDaysSettings');
        container.innerHTML = '';
        
        for (let i = 1; i <= 7; i++) {
            const dayIndex = i === 7 ? 0 : i;
            const isChecked = this.currentWorkDays.includes(dayIndex);
            const isWeekend = dayIndex === 0 || dayIndex === 6;
            
            const item = document.createElement('div');
            item.className = `work-day-item ${isWeekend ? 'weekend' : ''}`;
            item.innerHTML = `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="${dayIndex}" 
                           id="workDay${dayIndex}" ${isChecked ? 'checked' : ''}>
                    <label class="form-check-label" for="workDay${dayIndex}">
                        ${this.getFullDayName(dayIndex)}
                    </label>
                </div>
            `;
            container.appendChild(item);
        }
    }
    
    async saveWeekSettings() {
        const newWorkDays = [];
        document.querySelectorAll('#workDaysSettings input:checked').forEach(checkbox => {
            newWorkDays.push(parseInt(checkbox.value));
        });
        
        if (newWorkDays.length === 0) {
            this.showNotification('Выберите хотя бы один рабочий день', 'warning');
            return;
        }
        
        this.currentWorkDays = newWorkDays;
        
        try {
            await this.apiCall('/week-settings', {
                method: 'POST',
                body: JSON.stringify({
                    weekStart: this.currentWeekRange.start,
                    workDays: newWorkDays
                })
            });
            
            this.showNotification('Настройки недели сохранены', 'success');
            bootstrap.Modal.getInstance(document.getElementById('weekSettingsModal')).hide();
            
            this.renderGrid();
            this.updateCurrentDuty();
        } catch (error) {
            this.showNotification('Ошибка сохранения настроек недели', 'error');
        }
    }
    
    async changeWeek(direction) {
        const newDate = new Date(this.currentWeekRange.startDate);
        newDate.setDate(newDate.getDate() + direction * 7);
        this.currentWeekRange = this.getWeekRange(newDate);
        this.selectedDate = new Date(this.currentWeekRange.startDate);
        await this.loadData();
        this.renderGrid();
        this.renderMiniCalendar();
    }
    
    async goToCurrentWeek() {
        this.currentWeekRange = this.getWeekRange();
        this.selectedDate = new Date();
        await this.loadData();
        this.renderGrid();
        this.renderMiniCalendar();
    }
    
    startClock() {
        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('ru', { 
                hour: '2-digit', 
                minute: '2-digit'
            });
            document.getElementById('currentTime').textContent = timeString;
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    }
    
    showNotification(message, type = 'info') {
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

// Инициализация приложения
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DutyPlannerApp();
});