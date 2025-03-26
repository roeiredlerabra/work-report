// Enhanced NavigationSystem class with production-ready Project and Client Management

class NavigationSystem {
    constructor() {
        this.currentView = 'home';
        this.initializeNavigation();
        this.loadData();
    }
    calculateProjectStats(project) {
        const projectLogs = workLogs.filter(log => 
            log.type === 'work' && log.client === project.client
        );
    
        const totalHours = projectLogs.reduce((sum, log) => {
            const start = DateTime.fromFormat(log['start-time'], 'HH:mm');
            const end = DateTime.fromFormat(log['end-time'], 'HH:mm');
            return sum + end.diff(start, 'hours').hours;
        }, 0);
    
        const workDays = new Set(projectLogs.map(log => log.date)).size;
        const totalCost = totalHours * (project.hourlyRate || 0);
    
        return { totalHours, workDays, totalCost };
    }
    // Data Management
    loadData() {
        try {
            this.projects = JSON.parse(localStorage.getItem('projects') || '[]');
            this.clients = JSON.parse(localStorage.getItem('clients') || '[]');
            
            // Data integrity check - ensure all required fields exist
            this.projects = this.projects.map(project => ({
                id: project.id || Date.now().toString() + Math.random().toString(36).substring(2),
                name: project.name || '',
                client: project.client || '',
                description: project.description || '',
                hourlyRate: project.hourlyRate || 0,
                status: project.status || 'active',
                createdAt: project.createdAt || new Date().toISOString(),
                updatedAt: project.updatedAt || new Date().toISOString(),
                isArchived: project.isArchived || false
            }));
            
            this.clients = this.clients.map(client => ({
                id: client.id || Date.now().toString() + Math.random().toString(36).substring(2),
                name: client.name || '',
                contactPerson: client.contactPerson || '',
                email: client.email || '',
                phone: client.phone || '',
                address: client.address || '',
                notes: client.notes || '',
                isArchived: client.isArchived || false,
                createdAt: client.createdAt || new Date().toISOString(),
                updatedAt: client.updatedAt || new Date().toISOString()
            }));
            
            console.log('Data loaded successfully');
        } catch (error) {
            console.error('Error loading data:', error);
            // Initialize with empty arrays if there's an error
            this.projects = [];
            this.clients = [];
            
            // Show error notification
            if (typeof showNotification === 'function') {
                showNotification('אירעה שגיאה בטעינת הנתונים. נתונים אופסו.', 'error');
            }
        }
    }

    saveData() {
        try {
            localStorage.setItem('projects', JSON.stringify(this.projects));
            localStorage.setItem('clients', JSON.stringify(this.clients));
            console.log('Data saved successfully');
        } catch (error) {
            console.error('Error saving data:', error);
            if (typeof showNotification === 'function') {
                showNotification('אירעה שגיאה בשמירת הנתונים', 'error');
            }
        }
    }

    // Navigation Initialization
    initializeNavigation() {
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const screenName = e.target.textContent;
                this.handleNavigation(screenName);
            });
        });
    }

    handleNavigation(screenName) {
        document.querySelectorAll('nav a').forEach(navItem => {
            navItem.classList.remove('text-gray-900', 'font-medium');
            navItem.classList.add('text-gray-500');
        });

        const clickedItem = Array.from(document.querySelectorAll('nav a'))
            .find(item => item.textContent === screenName);
        if (clickedItem) {
            clickedItem.classList.remove('text-gray-500');
            clickedItem.classList.add('text-gray-900', 'font-medium');
        }

        this.displayScreen(screenName);
    }

    displayScreen(screenName) {
        const screens = {
            'בית': () => this.displayHomeView(),
            'דוחות': () => this.displayReportsView(),
            'פרויקטים': () => this.displayProjectsView(),
            'לקוחות': () => this.displayClientsView()
        };

        if (screens[screenName]) {
            screens[screenName]();
            this.currentView = screenName;
        }
    }

    // Home View
    displayHomeView() {
        updateReport();
    }

    // Reports View
    displayReportsView() {
        this.loadChartJs().then(() => {
            const stats = this.calculateWorkStats();
            this.renderReportsView(stats);
        });
    }

    async loadChartJs() {
        if (window.Chart) return;

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    calculateWorkStats() {
        const currentDate = DateTime.now();
        const startOfMonth = currentDate.startOf('month');
        const endOfMonth = currentDate.endOf('month');
        
        const monthLogs = workLogs.filter(log => {
            const logDate = DateTime.fromISO(log.date);
            return logDate >= startOfMonth && logDate <= endOfMonth;
        });

        const totalHoursObj = this.calculateDailyHours(monthLogs);
        const totalHours = Object.values(totalHoursObj).reduce((sum, hours) => sum + hours, 0);
        const workDays = Object.keys(totalHoursObj).length;

        return {
            totalHours,
            workDays,
            totalDays: endOfMonth.day,
            averageHoursPerDay: workDays ? totalHours / workDays : 0,
            locations: this.calculateLocationDistribution(monthLogs),
            types: this.calculateTypeDistribution(monthLogs),
            clientStats: this.calculateClientStatistics(monthLogs),
            dailyHours: totalHoursObj
        };
    }

    calculateTypeDistribution(logs) {
        return logs.reduce((acc, log) => {
            acc[log.type] = (acc[log.type] || 0) + 1;
            return acc;
        }, {});
    }

    calculateLocationDistribution(logs) {
        return logs.reduce((acc, log) => {
            if (log.location) {
                acc[log.location] = (acc[log.location] || 0) + 1;
            }
            return acc;
        }, {});
    }

    calculateDailyHours(logs) {
        const dailyHours = {};
        logs.filter(log => log.type === 'work').forEach(log => {
            if (!dailyHours[log.date]) dailyHours[log.date] = 0;
            const start = DateTime.fromFormat(log['start-time'], 'HH:mm');
            const end = DateTime.fromFormat(log['end-time'], 'HH:mm');
            dailyHours[log.date] += end.diff(start, 'hours').hours;
        });
        return dailyHours;
    }

    calculateClientStatistics(logs) {
        const workLogs = logs.filter(log => log.type === 'work');
        const clientStats = {};

        workLogs.forEach(log => {
            if (!clientStats[log.client]) {
                clientStats[log.client] = {
                    totalHours: 0,
                    workDays: new Set(),
                    client: log.client
                };
            }

            const start = DateTime.fromFormat(log['start-time'], 'HH:mm');
            const end = DateTime.fromFormat(log['end-time'], 'HH:mm');
            const hours = end.diff(start, 'hours').hours;

            clientStats[log.client].totalHours += hours;
            clientStats[log.client].workDays.add(log.date);
        });

        Object.values(clientStats).forEach(stat => {
            stat.workDays = stat.workDays.size;
        });

        return clientStats;
    }

    renderReportsView(stats) {
        const reportContent = document.getElementById('report-content');
        reportContent.innerHTML = `
            <h2 class="text-2xl font-semibold mb-4">דוחות עבודה</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-semibold mb-2">סה"כ שעות עבודה</h3>
                    <p class="text-3xl font-bold text-indigo-600">${Number(stats.totalHours).toFixed(1)}</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-semibold mb-2">מספר ימי עבודה</h3>
                    <p class="text-3xl font-bold text-indigo-600">${stats.workDays} / ${stats.totalDays}</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-semibold mb-2">ממוצע שעות ליום</h3>
                    <p class="text-3xl font-bold text-indigo-600">${Number(stats.averageHoursPerDay).toFixed(1)}</p>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-semibold mb-4">התפלגות לפי לקוחות</h3>
                    <canvas id="client-chart" height="200"></canvas>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-semibold mb-4">התפלגות לפי סוגי דיווח</h3>
                    <canvas id="type-chart" height="200"></canvas>
                </div>
            </div>
        `;

        // Render charts if Chart.js is available
        if (window.Chart) {
            this.renderClientChart(stats);
            this.renderTypeChart(stats);
        }
    }

    renderClientChart(stats) {
        const clientStats = Object.values(stats.clientStats || {});
        if (clientStats.length === 0) return;

        // Sort by total hours (descending)
        clientStats.sort((a, b) => b.totalHours - a.totalHours);
        
        // Take top 5 clients and combine the rest
        let chartData;
        if (clientStats.length > 5) {
            const top5 = clientStats.slice(0, 5);
            const others = clientStats.slice(5).reduce(
                (acc, curr) => {
                    acc.totalHours += curr.totalHours;
                    return acc;
                },
                { client: 'אחרים', totalHours: 0 }
            );
            chartData = [...top5, others];
        } else {
            chartData = clientStats;
        }

        const ctx = document.getElementById('client-chart');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: chartData.map(item => item.client),
                datasets: [{
                    data: chartData.map(item => item.totalHours),
                    backgroundColor: [
                        '#4F46E5', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    }
                }
            }
        });
    }

    renderTypeChart(stats) {
        const typeData = stats.types || {};
        if (Object.keys(typeData).length === 0) return;

        const types = {
            'work': 'עבודה רגילה',
            'sick': 'מחלה',
            'family_sick': 'מחלה משפחתית',
            'vacation': 'חופשה',
            'reserve': 'מילואים',
            'bereavement': 'אבל',
            'study': 'ימי השתלמות'
        };

        const colors = {
            'work': '#4F46E5',
            'sick': '#EF4444',
            'family_sick': '#F87171',
            'vacation': '#10B981',
            'reserve': '#F59E0B',
            'bereavement': '#8B5CF6',
            'study': '#EC4899'
        };

        const labels = [];
        const data = [];
        const backgroundColor = [];

        for (const [type, count] of Object.entries(typeData)) {
            labels.push(types[type] || type);
            data.push(count);
            backgroundColor.push(colors[type] || '#6B7280');
        }

        const ctx = document.getElementById('type-chart');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // ***** PROJECT MANAGEMENT *****
    
    displayProjectsView() {
        const reportContent = document.getElementById('report-content');
        reportContent.innerHTML = this.generateProjectsHTML();
        this.initializeProjectHandlers();
    }

    generateProjectsHTML() {
        return `
            <div class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 class="text-2xl font-semibold">ניהול פרויקטים</h2>
                    <p class="text-gray-500 text-sm mt-1">ניהול ומעקב אחר הפרויקטים שלך</p>
                </div>
                <div class="flex flex-col sm:flex-row gap-4">
                    <div class="relative">
                        <input type="text" id="project-search" placeholder="חיפוש פרויקטים..." 
                               class="w-full sm:w-64 px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                        <svg class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <select id="project-status-filter" class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                        <option value="all">כל הסטטוסים</option>
                        <option value="active" selected>פעילים</option>
                        <option value="completed">הושלמו</option>
                        <option value="on-hold">בהמתנה</option>
                        <option value="archived">בארכיון</option>
                    </select>
                    <button onclick="navigationSystem.openNewProjectModal()" 
                            class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        פרויקט חדש
                    </button>
                </div>
            </div>
            
            <div id="projects-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${this.generateProjectCards()}
            </div>
            
            ${this.generateProjectModalHTML()}
            ${this.generateDeleteConfirmationModal('project')}
        `;
    }

    generateProjectCards() {
        // Filter projects based on active filter (default to active)
        const statusFilter = 'active'; // Default filter - will be updated by event handlers
        const filteredProjects = this.projects.filter(project => 
            statusFilter === 'all' || 
            (statusFilter === 'archived' ? project.isArchived : (!project.isArchived && project.status === statusFilter))
        );

        if (!filteredProjects.length) {
            return `
                <div class="col-span-full bg-gray-50 rounded-lg p-8 text-center">
                    <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">אין פרויקטים להצגה</h3>
                    <p class="text-gray-500 mb-4">התחל ליצור פרויקטים חדשים כדי לנהל את העבודה שלך</p>
                    <button onclick="navigationSystem.openNewProjectModal()" 
                            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
                        צור פרויקט חדש
                    </button>
                </div>
            `;
        }

        return filteredProjects.map(project => {
            const stats = this.calculateProjectStats(project);
            const statusColors = {
                'active': 'bg-green-100 text-green-800',
                'completed': 'bg-blue-100 text-blue-800',
                'on-hold': 'bg-yellow-100 text-yellow-800',
                'cancelled': 'bg-red-100 text-red-800'
            };
            const statusText = {
                'active': 'פעיל',
                'completed': 'הושלם',
                'on-hold': 'בהמתנה',
                'cancelled': 'בוטל'
            };
            
            return `
                <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div class="p-6">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">${this.escapeHtml(project.name)}</h3>
                                <p class="text-sm text-gray-500 mt-1">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}">
                                        ${statusText[project.status] || project.status}
                                    </span>
                                </p>
                            </div>
                            <div class="flex gap-1">
                                <button onclick="navigationSystem.editProject('${project.id}')" 
                                        class="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                                        aria-label="ערוך פרויקט">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                                <button onclick="navigationSystem.toggleArchiveProject('${project.id}')" 
                                        class="text-gray-400 hover:text-yellow-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                                        aria-label="${project.isArchived ? 'שחזר פרויקט' : 'העבר לארכיון'}">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                              d="${project.isArchived 
                                                  ? 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' 
                                                  : 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'}" />
                                    </svg>
                                </button>
                                <button onclick="navigationSystem.confirmDeleteProject('${project.id}')" 
                                        class="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                                        aria-label="מחק פרויקט">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div class="mt-4">
                            <p class="text-sm text-gray-600">
                                <span class="font-medium">לקוח:</span> ${this.escapeHtml(project.client)}
                            </p>
                            ${project.description ? `
                                <p class="text-sm text-gray-500 mt-2 line-clamp-2" title="${this.escapeHtml(project.description)}">
                                    ${this.escapeHtml(project.description)}
                                </p>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="border-t border-gray-200 bg-gray-50 px-6 py-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-xs text-gray-500">סה"כ שעות</p>
                                <p class="font-semibold text-gray-900">${stats.totalHours.toFixed(1)}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500">סה"כ הכנסות</p>
                                <p class="font-semibold text-gray-900">₪${Math.round(stats.totalCost).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    generateProjectModalHTML() {
        return `
            <div id="project-modal" class="fixed inset-0 z-50 hidden overflow-y-auto overflow-x-hidden">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="fixed inset-0 bg-black opacity-50 transition-opacity" onclick="navigationSystem.closeProjectModal()"></div>
                    <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
                        <div class="flex justify-between items-center p-6 border-b">
                            <h3 class="text-xl font-semibold" id="project-modal-title">פרויקט חדש</h3>
                            <button type="button" onclick="navigationSystem.closeProjectModal()" 
                                    class="text-gray-400 hover:text-gray-500 focus:outline-none">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div class="p-6">
                            <form id="project-form" class="space-y-4">
                                <input type="hidden" name="projectId" id="project-id">
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1" for="project-name">
                                        שם הפרויקט <span class="text-red-500">*</span>
                                    </label>
                                    <input type="text" id="project-name" name="projectName" required
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <p id="project-name-error" class="text-red-500 text-xs mt-1 hidden"></p>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1" for="project-client">
                                        לקוח <span class="text-red-500">*</span>
                                    </label>
                                    <select id="project-client" name="client" required
                                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value="">בחר לקוח</option>
                                        ${this.generateClientOptions()}
                                    </select>
                                    <p id="project-client-error" class="text-red-500 text-xs mt-1 hidden"></p>
                                    <button type="button" id="add-new-client-btn" 
                                            class="text-indigo-600 hover:text-indigo-800 text-sm mt-1">
                                        + הוסף לקוח חדש
                                    </button>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1" for="project-status">
                                        סטטוס
                                    </label>
                                    <select id="project-status" name="status"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value="active">פעיל</option>
                                        <option value="completed">הושלם</option>
                                        <option value="on-hold">בהמתנה</option>
                                        <option value="cancelled">בוטל</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1" for="project-rate">
                                        תעריף שעתי (₪)
                                    </label>
                                    <input type="number" id="project-rate" name="hourlyRate" min="0" step="1"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1" for="project-description">
                                        תיאור
                                    </label>
                                    <textarea id="project-description" name="description" rows="3"
                                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                                </div>
                                
                                <div class="flex justify-end gap-3 pt-4">
                                    <button type="button" onclick="navigationSystem.closeProjectModal()"
                                            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                        ביטול
                                    </button>
                                    <button type="submit"
                                            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        שמור
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateDeleteConfirmationModal(type) {
        return `
            <div id="${type}-delete-modal" class="fixed inset-0 z-50 hidden overflow-y-auto overflow-x-hidden">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="fixed inset-0 bg-black opacity-50 transition-opacity"></div>
                    <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
                        <div class="p-6">
                            <div class="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 class="text-lg font-medium text-gray-900 text-center mb-2">
                                האם אתה בטוח?
                            </h3>
                            <p class="text-gray-500 text-center mb-6">
                                פעולה זו תמחק את ה${type === 'project' ? 'פרויקט' : 'לקוח'} לצמיתות ולא ניתן יהיה לשחזר אותו.
                            </p>
                            
                            <div class="flex justify-center gap-4">
                                <button type="button" onclick="navigationSystem.closeDeleteModal('${type}')"
                                        class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                    ביטול
                                </button>
                                <button type="button" id="confirm-delete-${type}" 
                                        class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                                    מחק
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    initializeProjectHandlers() {
        // Add form submission handler
        const projectForm = document.getElementById('project-form');
        if (projectForm) {
            projectForm.addEventListener('submit', (e) => this.handleProjectFormSubmit(e));
        }

        // Add event listener for search input
        const searchInput = document.getElementById('project-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterProjects());
        }

        // Add event listener for status filter
        const statusFilter = document.getElementById('project-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterProjects());
        }

        // Add event listener for "Add new client" button
        const addClientBtn = document.getElementById('add-new-client-btn');
        if (addClientBtn) {
            addClientBtn.addEventListener('click', () => {
                this.closeProjectModal();
                setTimeout(() => this.openNewClientModal('fromProject'), 300);
            });
        }

        // Set up delete confirmation button
        const confirmDeleteBtn = document.getElementById('confirm-delete-project');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                const projectId = confirmDeleteBtn.getAttribute('data-id');
                if (projectId) {
                    this.deleteProject(projectId);
                }
            });
        }
    }

    filterProjects() {
        const searchTerm = document.getElementById('project-search').value.toLowerCase();
        const statusFilter = document.getElementById('project-status-filter').value;
        
        // Apply filters
        const filteredProjects = this.projects.filter(project => {
            const matchesSearch = project.name.toLowerCase().includes(searchTerm) || 
                                 project.client.toLowerCase().includes(searchTerm) ||
                                 (project.description && project.description.toLowerCase().includes(searchTerm));
            
            const matchesStatus = statusFilter === 'all' || 
                                 (statusFilter === 'archived' ? project.isArchived : 
                                 (!project.isArchived && project.status === statusFilter));
            
            return matchesSearch && matchesStatus;
        });

        // Update projects grid
        const projectsGrid = document.getElementById('projects-grid');
        
        if (filteredProjects.length === 0) {
            projectsGrid.innerHTML = `
                <div class="col-span-full bg-gray-50 rounded-lg p-8 text-center">
                    <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">לא נמצאו פרויקטים</h3>
                    <p class="text-gray-500 mb-4">נסה לשנות את מסנני החיפוש או צור פרויקט חדש</p>
                    <button onclick="navigationSystem.openNewProjectModal()" 
                            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
                        צור פרויקט חדש
                    </button>
                </div>
            `;
        } else {
            // Generate HTML for filtered projects
            projectsGrid.innerHTML = filteredProjects.map(project => {
                const stats = this.calculateProjectStats(project);
                const statusColors = {
                    'active': 'bg-green-100 text-green-800',
                    'completed': 'bg-blue-100 text-blue-800',
                    'on-hold': 'bg-yellow-100 text-yellow-800',
                    'cancelled': 'bg-red-100 text-red-800'
                };
                const statusText = {
                    'active': 'פעיל',
                    'completed': 'הושלם',
                    'on-hold': 'בהמתנה',
                    'cancelled': 'בוטל'
                };
                
                return `
                    <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <div class="p-6">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900">${this.escapeHtml(project.name)}</h3>
                                    <p class="text-sm text-gray-500 mt-1">
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}">
                                            ${statusText[project.status] || project.status}
                                        </span>
                                        ${project.isArchived ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-2">בארכיון</span>' : ''}
                                    </p>
                                </div>
                                <div class="flex gap-1">
                                    <button onclick="navigationSystem.editProject('${project.id}')" 
                                            class="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                                            aria-label="ערוך פרויקט">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                    <button onclick="navigationSystem.toggleArchiveProject('${project.id}')" 
                                            class="text-gray-400 hover:text-yellow-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                                            aria-label="${project.isArchived ? 'שחזר פרויקט' : 'העבר לארכיון'}">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                  d="${project.isArchived 
                                                      ? 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' 
                                                      : 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'}" />
                                        </svg>
                                    </button>
                                    <button onclick="navigationSystem.confirmDeleteProject('${project.id}')" 
                                            class="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                                            aria-label="מחק פרויקט">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="mt-4">
                                <p class="text-sm text-gray-600">
                                    <span class="font-medium">לקוח:</span> ${this.escapeHtml(project.client)}
                                </p>
                                ${project.description ? `
                                    <p class="text-sm text-gray-500 mt-2 line-clamp-2" title="${this.escapeHtml(project.description)}">
                                        ${this.escapeHtml(project.description)}
                                    </p>
                                ` : ''}
                            </div>
                        </div>
                        
                        <div class="border-t border-gray-200 bg-gray-50 px-6 py-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <p class="text-xs text-gray-500">סה"כ שעות</p>
                                    <p class="font-semibold text-gray-900">${stats.totalHours.toFixed(1)}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500">סה"כ הכנסות</p>
                                    <p class="font-semibold text-gray-900">₪${Math.round(stats.totalCost).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    generateClientOptions() {
        // Get all unique clients from projects and work logs
        const clientsFromProjects = this.projects.map(project => project.client);
        const clientsFromLogs = workLogs.map(log => log.client);
        const clientsFromClientsList = this.clients.map(client => client.name);
        
        // Combine all sources and remove duplicates
        const uniqueClients = [...new Set([...clientsFromProjects, ...clientsFromLogs, ...clientsFromClientsList])];
        
        // Filter out empty strings and sort alphabetically
        return uniqueClients
            .filter(client => client && client.trim())
            .sort()
            .map(client => `<option value="${this.escapeHtml(client)}">${this.escapeHtml(client)}</option>`)
            .join('');
    }

    openNewProjectModal() {
        document.getElementById('project-modal-title').textContent = 'פרויקט חדש';
        document.getElementById('project-form').reset();
        document.getElementById('project-id').value = '';
        document.getElementById('project-modal').classList.remove('hidden');
        document.getElementById('project-name').focus();
    }

    editProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            showNotification('הפרויקט לא נמצא', 'error');
            return;
        }

        document.getElementById('project-modal-title').textContent = 'עריכת פרויקט';
        document.getElementById('project-id').value = project.id;
        document.getElementById('project-name').value = project.name;
        document.getElementById('project-client').value = project.client;
        document.getElementById('project-status').value = project.status;
        document.getElementById('project-rate').value = project.hourlyRate || '';
        document.getElementById('project-description').value = project.description || '';

        document.getElementById('project-modal').classList.remove('hidden');
    }

    closeProjectModal() {
        document.getElementById('project-modal').classList.add('hidden');
        // Clear validation errors
        document.querySelectorAll('#project-form .text-red-500').forEach(el => {
            el.textContent = '';
            el.classList.add('hidden');
        });
    }

    validateProjectForm() {
        let isValid = true;
        
        // Check project name
        const nameInput = document.getElementById('project-name');
        const nameError = document.getElementById('project-name-error');
        if (!nameInput.value.trim()) {
            nameError.textContent = 'שם פרויקט הוא שדה חובה';
            nameError.classList.remove('hidden');
            isValid = false;
        } else {
            nameError.classList.add('hidden');
        }
        
        // Check client
        const clientInput = document.getElementById('project-client');
        const clientError = document.getElementById('project-client-error');
        if (!clientInput.value.trim()) {
            clientError.textContent = 'לקוח הוא שדה חובה';
            clientError.classList.remove('hidden');
            isValid = false;
        } else {
            clientError.classList.add('hidden');
        }
        
        return isValid;
    }

    handleProjectFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateProjectForm()) {
            return; // Don't proceed if validation fails
        }
        
        const formData = new FormData(e.target);
        const projectId = formData.get('projectId');
        
        const projectData = {
            id: projectId || Date.now().toString(),
            name: formData.get('projectName').trim(),
            client: formData.get('client').trim(),
            description: formData.get('description').trim(),
            hourlyRate: parseFloat(formData.get('hourlyRate')) || 0,
            status: formData.get('status'),
            updatedAt: new Date().toISOString()
        };

        if (projectId) {
            // Update existing project
            const index = this.projects.findIndex(p => p.id === projectId);
            if (index !== -1) {
                // Preserve fields that aren't in the form
                const existingProject = this.projects[index];
                this.projects[index] = { 
                    ...existingProject, 
                    ...projectData 
                };
                showNotification('הפרויקט עודכן בהצלחה', 'success');
            } else {
                showNotification('הפרויקט לא נמצא', 'error');
            }
        } else {
            // Add new project
            projectData.createdAt = new Date().toISOString();
            projectData.isArchived = false;
            this.projects.push(projectData);
            
            // Create a client record if it doesn't exist
            const clientExists = this.clients.some(client => client.name === projectData.client);
            if (!clientExists) {
                this.clients.push({
                    id: Date.now().toString(),
                    name: projectData.client,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isArchived: false
                });
            }
            
            showNotification('הפרויקט נוצר בהצלחה', 'success');
        }

        this.saveData();
        this.closeProjectModal();
        this.displayProjectsView(); // Refresh the view
    }

    confirmDeleteProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            showNotification('הפרויקט לא נמצא', 'error');
            return;
        }
        
        // Set the project ID on the confirmation button
        document.getElementById('confirm-delete-project').setAttribute('data-id', projectId);
        
        // Show modal
        document.getElementById('project-delete-modal').classList.remove('hidden');
    }

    closeDeleteModal(type) {
        document.getElementById(`${type}-delete-modal`).classList.add('hidden');
    }

    deleteProject(projectId) {
        this.projects = this.projects.filter(p => p.id !== projectId);
        this.saveData();
        this.closeDeleteModal('project');
        this.displayProjectsView();
        showNotification('הפרויקט נמחק בהצלחה', 'success');
    }

    toggleArchiveProject(projectId) {
        const projectIndex = this.projects.findIndex(p => p.id === projectId);
        if (projectIndex === -1) {
            showNotification('הפרויקט לא נמצא', 'error');
            return;
        }
        
        // Toggle archived status
        this.projects[projectIndex].isArchived = !this.projects[projectIndex].isArchived;
        this.saveData();
        this.displayProjectsView();
        
        showNotification(
            this.projects[projectIndex].isArchived 
                ? 'הפרויקט הועבר לארכיון בהצלחה' 
                : 'הפרויקט שוחזר מהארכיון בהצלחה',
            'success'
        );
    }

    // ***** CLIENT MANAGEMENT *****

    displayClientsView() {
        const reportContent = document.getElementById('report-content');
        reportContent.innerHTML = this.generateClientsHTML();
        this.initializeClientHandlers();
    }

    generateClientsHTML() {
        return `
            <div class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 class="text-2xl font-semibold">ניהול לקוחות</h2>
                    <p class="text-gray-500 text-sm mt-1">ניהול רשימת הלקוחות שלך</p>
                </div>
                <div class="flex flex-col sm:flex-row gap-4">
                    <div class="relative">
                        <input type="text" id="client-search" placeholder="חיפוש לקוחות..." 
                               class="w-full sm:w-64 px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                        <svg class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <select id="client-filter" class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                        <option value="all">כל הלקוחות</option>
                        <option value="active" selected>לקוחות פעילים</option>
                        <option value="archived">לקוחות בארכיון</option>
                    </select>
                    <button onclick="navigationSystem.openNewClientModal()" 
                            class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        לקוח חדש
                    </button>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div id="clients-list">
                    ${this.generateClientsTable()}
                </div>
            </div>
            
            ${this.generateClientModalHTML()}
            ${this.generateDeleteConfirmationModal('client')}
        `;
    }

    generateClientsTable() {
        const clients = this.getAllClients();
        const filter = 'active'; // Default filter value - will be updated by event handlers
        
        const filteredClients = filter === 'all' 
            ? clients 
            : clients.filter(client => 
                filter === 'archived' ? client.isArchived : !client.isArchived
            );
        
        if (filteredClients.length === 0) {
            return `
                <div class="text-center py-12">
                    <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">אין לקוחות להצגה</h3>
                    <p class="text-gray-500 mb-4">התחל ליצור לקוחות חדשים לניהול הפרויקטים שלך</p>
                    <button onclick="navigationSystem.openNewClientModal()" 
                            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
                        צור לקוח חדש
                    </button>
                </div>
            `;
        }

        return `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                שם הלקוח
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                איש קשר
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                טלפון
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                פרויקטים
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                סה"כ שעות
                            </th>
                            <th scope="col" class="relative px-6 py-3">
                                <span class="sr-only">פעולות</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${filteredClients.map(client => this.generateClientRow(client)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    generateClientRow(client) {
        const stats = this.calculateClientStats(client);
        return `
            <tr class="${client.isArchived ? 'bg-gray-50' : ''}">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full ${client.isArchived ? 'bg-gray-200' : 'bg-indigo-100'}">
                            <span class="text-${client.isArchived ? 'gray' : 'indigo'}-600 font-medium text-lg">
                                ${client.name.substring(0, 1).toUpperCase()}
                            </span>
                        </div>
                        <div class="mr-4">
                            <div class="text-sm font-medium text-gray-900 flex items-center">
                                ${this.escapeHtml(client.name)}
                                ${client.isArchived ? '<span class="mr-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">בארכיון</span>' : ''}
                            </div>
                            ${client.email ? `<div class="text-sm text-gray-500 truncate max-w-xs">${this.escapeHtml(client.email)}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${this.escapeHtml(client.contactPerson) || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 ltr">
                    ${client.phone ? `<a href="tel:${client.phone}" class="text-indigo-600 hover:text-indigo-900">${this.escapeHtml(client.phone)}</a>` : '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${stats.activeProjects}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${stats.totalHours.toFixed(1)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                    <div class="flex justify-end gap-2">
                        <button onclick="navigationSystem.viewClientDetails('${client.id}')" 
                                class="text-gray-400 hover:text-indigo-600 p-1 rounded hover:bg-gray-100"
                                aria-label="פרטי לקוח">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                        <button onclick="navigationSystem.editClient('${client.id}')" 
                                class="text-gray-400 hover:text-indigo-600 p-1 rounded hover:bg-gray-100"
                                aria-label="ערוך לקוח">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                        <button onclick="navigationSystem.toggleArchiveClient('${client.id}')" 
                                class="text-gray-400 hover:text-yellow-600 p-1 rounded hover:bg-gray-100"
                                aria-label="${client.isArchived ? 'שחזר לקוח' : 'העבר לארכיון'}">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="${client.isArchived 
                                          ? 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' 
                                          : 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'}" />
                            </svg>
                        </button>
                        <button onclick="navigationSystem.confirmDeleteClient('${client.id}')" 
                                class="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-gray-100"
                                aria-label="מחק לקוח">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    generateClientModalHTML() {
        return `
            <div id="client-modal" class="fixed inset-0 z-50 hidden overflow-y-auto overflow-x-hidden">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="fixed inset-0 bg-black opacity-50 transition-opacity" onclick="navigationSystem.closeClientModal()"></div>
                    <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
                        <div class="flex justify-between items-center p-6 border-b">
                            <h3 class="text-xl font-semibold" id="client-modal-title">לקוח חדש</h3>
                            <button type="button" onclick="navigationSystem.closeClientModal()" 
                                    class="text-gray-400 hover:text-gray-500 focus:outline-none">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div class="p-6">
                            <form id="client-form" class="space-y-4">
                                <input type="hidden" name="clientId" id="client-id">
                                <input type="hidden" name="returnToProjects" id="return-to-projects" value="false">
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1" for="client-name">
                                        שם הלקוח <span class="text-red-500">*</span>
                                    </label>
                                    <input type="text" id="client-name" name="clientName" required
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <p id="client-name-error" class="text-red-500 text-xs mt-1 hidden"></p>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1" for="client-contact">
                                        איש קשר
                                    </label>
                                    <input type="text" id="client-contact" name="contactPerson"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1" for="client-email">
                                        דוא"ל
                                    </label>
                                    <input type="email" id="client-email" name="email"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <p id="client-email-error" class="text-red-500 text-xs mt-1 hidden"></p>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1" for="client-phone">
                                        טלפון
                                    </label>
                                    <input type="tel" id="client-phone" name="phone"
                                           dir="ltr" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1" for="client-address">
                                        כתובת
                                    </label>
                                    <input type="text" id="client-address" name="address"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1" for="client-notes">
                                        הערות
                                    </label>
                                    <textarea id="client-notes" name="notes" rows="3"
                                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                                </div>
                                
                                <div class="flex justify-end gap-3 pt-4">
                                    <button type="button" onclick="navigationSystem.closeClientModal()"
                                            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                        ביטול
                                    </button>
                                    <button type="submit"
                                            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        שמור
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="client-details-modal" class="fixed inset-0 z-50 hidden overflow-y-auto overflow-x-hidden">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="fixed inset-0 bg-black opacity-50 transition-opacity" onclick="navigationSystem.closeClientDetailsModal()"></div>
                    <div class="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-auto">
                        <div class="flex justify-between items-center p-6 border-b">
                            <h3 class="text-xl font-semibold" id="client-details-title">פרטי לקוח</h3>
                            <button type="button" onclick="navigationSystem.closeClientDetailsModal()" 
                                    class="text-gray-400 hover:text-gray-500 focus:outline-none">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div class="p-6" id="client-details-content">
                            <!-- Content will be dynamically generated -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getAllClients() {
        // Get all clients from the clients list
        const knownClients = [...this.clients];
        
        // Get unique client names from work logs that might not be in the clients list
        const clientNamesFromLogs = [...new Set(workLogs.map(log => log.client))];
        
        // Add any missing clients from work logs
        clientNamesFromLogs.forEach(clientName => {
            if (clientName && !knownClients.some(c => c.name === clientName)) {
                knownClients.push({
                    id: Date.now().toString() + Math.random().toString(36).substring(2),
                    name: clientName,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isArchived: false
                });
            }
        });
        
        return knownClients;
    }

    calculateClientStats(client) {
        const clientName = client.name || client;
        
        // Find all work logs for this client
        const clientLogs = workLogs.filter(log => 
            log.client === clientName && log.type === 'work'
        );

        // Calculate total hours
        const totalHours = clientLogs.reduce((sum, log) => {
            const start = DateTime.fromFormat(log['start-time'], 'HH:mm');
            const end = DateTime.fromFormat(log['end-time'], 'HH:mm');
            return sum + end.diff(start, 'hours').hours;
        }, 0);

        // Count active projects for this client
        const activeProjects = this.projects.filter(p => 
            p.client === clientName && p.status === 'active' && !p.isArchived
        ).length;

        // Count total projects for this client
        const totalProjects = this.projects.filter(p => 
            p.client === clientName
        ).length;

        // Calculate most recent work date
        let mostRecentDate = null;
        if (clientLogs.length > 0) {
            mostRecentDate = clientLogs.reduce((latest, log) => {
                const logDate = DateTime.fromISO(log.date);
                return logDate > latest ? logDate : latest;
            }, DateTime.fromISO(clientLogs[0].date));
        }

        return { 
            totalHours, 
            activeProjects, 
            totalProjects,
            mostRecentDate: mostRecentDate ? mostRecentDate.toFormat('dd/MM/yyyy') : null
        };
    }

    initializeClientHandlers() {
        // Add form submission handler
        const clientForm = document.getElementById('client-form');
        if (clientForm) {
            clientForm.addEventListener('submit', (e) => this.handleClientFormSubmit(e));
        }

        // Add event listener for search input
        const searchInput = document.getElementById('client-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterClients());
        }

        // Add event listener for client filter
        const clientFilter = document.getElementById('client-filter');
        if (clientFilter) {
            clientFilter.addEventListener('change', () => this.filterClients());
        }

        // Set up delete confirmation button
        const confirmDeleteBtn = document.getElementById('confirm-delete-client');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                const clientId = confirmDeleteBtn.getAttribute('data-id');
                if (clientId) {
                    this.deleteClient(clientId);
                }
            });
        }
    }

    filterClients() {
        const searchTerm = document.getElementById('client-search')?.value.toLowerCase() || '';
        const filterValue = document.getElementById('client-filter')?.value || 'active';
        
        const clients = this.getAllClients();
        
        // Apply filters
        const filteredClients = clients.filter(client => {
            const matchesSearch = client.name.toLowerCase().includes(searchTerm) || 
                                (client.contactPerson && client.contactPerson.toLowerCase().includes(searchTerm)) ||
                                (client.email && client.email.toLowerCase().includes(searchTerm)) ||
                                (client.phone && client.phone.includes(searchTerm));
            
            const matchesFilter = filterValue === 'all' || 
                                (filterValue === 'archived' ? client.isArchived : !client.isArchived);
            
            return matchesSearch && matchesFilter;
        });
        
        // Update clients list
        const clientsList = document.getElementById('clients-list');
        
        if (filteredClients.length === 0) {
            clientsList.innerHTML = `
                <div class="text-center py-12">
                    <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">לא נמצאו לקוחות</h3>
                    <p class="text-gray-500 mb-4">נסה לשנות את מסנני החיפוש או צור לקוח חדש</p>
                    <button onclick="navigationSystem.openNewClientModal()" 
                            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
                        צור לקוח חדש
                    </button>
                </div>
            `;
        } else {
            clientsList.innerHTML = `
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    שם הלקוח
                                </th>
                                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    איש קשר
                                </th>
                                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    טלפון
                                </th>
                                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    פרויקטים
                                </th>
                                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    סה"כ שעות
                                </th>
                                <th scope="col" class="relative px-6 py-3">
                                    <span class="sr-only">פעולות</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${filteredClients.map(client => this.generateClientRow(client)).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    }

    openNewClientModal(source = '') {
        document.getElementById('client-modal-title').textContent = 'לקוח חדש';
        document.getElementById('client-form').reset();
        document.getElementById('client-id').value = '';
        
        // If coming from projects view, set flag to return there after saving
        if (source === 'fromProject') {
            document.getElementById('return-to-projects').value = 'true';
        } else {
            document.getElementById('return-to-projects').value = 'false';
        }
        
        document.getElementById('client-modal').classList.remove('hidden');
        document.getElementById('client-name').focus();
    }

    editClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) {
            showNotification('הלקוח לא נמצא', 'error');
            return;
        }

        document.getElementById('client-modal-title').textContent = 'עריכת לקוח';
        document.getElementById('client-id').value = client.id;
        document.getElementById('client-name').value = client.name || '';
        document.getElementById('client-contact').value = client.contactPerson || '';
        document.getElementById('client-email').value = client.email || '';
        document.getElementById('client-phone').value = client.phone || '';
        document.getElementById('client-address').value = client.address || '';
        document.getElementById('client-notes').value = client.notes || '';
        document.getElementById('return-to-projects').value = 'false';

        document.getElementById('client-modal').classList.remove('hidden');
    }

    closeClientModal() {
        document.getElementById('client-modal').classList.add('hidden');
        // Clear validation errors
        document.querySelectorAll('#client-form .text-red-500').forEach(el => {
            el.textContent = '';
            el.classList.add('hidden');
        });
    }

    validateClientForm() {
        let isValid = true;
        
        // Check client name
        const nameInput = document.getElementById('client-name');
        const nameError = document.getElementById('client-name-error');
        if (!nameInput.value.trim()) {
            nameError.textContent = 'שם הלקוח הוא שדה חובה';
            nameError.classList.remove('hidden');
            isValid = false;
        } else {
            nameError.classList.add('hidden');
        }
        
        // Check email format if provided
        const emailInput = document.getElementById('client-email');
        const emailError = document.getElementById('client-email-error');
        if (emailInput.value.trim() && !this.isValidEmail(emailInput.value.trim())) {
            emailError.textContent = 'כתובת דוא"ל אינה תקינה';
            emailError.classList.remove('hidden');
            isValid = false;
        } else {
            emailError.classList.add('hidden');
        }
        
        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    handleClientFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateClientForm()) {
            return; // Don't proceed if validation fails
        }
        
        const formData = new FormData(e.target);
        const clientId = formData.get('clientId');
        const returnToProjects = formData.get('returnToProjects') === 'true';
        
        const clientData = {
            id: clientId || Date.now().toString(),
            name: formData.get('clientName').trim(),
            contactPerson: formData.get('contactPerson').trim(),
            email: formData.get('email').trim(),
            phone: formData.get('phone').trim(),
            address: formData.get('address').trim(),
            notes: formData.get('notes').trim(),
            updatedAt: new Date().toISOString()
        };

        if (clientId) {
            // Update existing client
            const index = this.clients.findIndex(c => c.id === clientId);
            if (index !== -1) {
                // Preserve fields that aren't in the form
                const existingClient = this.clients[index];
                this.clients[index] = { 
                    ...existingClient, 
                    ...clientData 
                };
                showNotification('הלקוח עודכן בהצלחה', 'success');
            } else {
                showNotification('הלקוח לא נמצא', 'error');
            }
        } else {
            // Add new client
            clientData.createdAt = new Date().toISOString();
            clientData.isArchived = false;
            this.clients.push(clientData);
            showNotification('הלקוח נוצר בהצלחה', 'success');
            
            // Update project-client select if we're coming from the project form
            if (returnToProjects) {
                // We'll need to update the project form's client dropdown when we return
                this.clientCreatedForProject = clientData.name;
            }
        }

        this.saveData();
        this.closeClientModal();
        
        // If we came from the project form, return there
        if (returnToProjects) {
            this.displayProjectsView();
            setTimeout(() => {
                this.openNewProjectModal();
                // Select the newly created client
                if (this.clientCreatedForProject) {
                    const clientSelect = document.getElementById('project-client');
                    if (clientSelect) {
                        // First check if option exists
                        let option = Array.from(clientSelect.options).find(o => o.value === this.clientCreatedForProject);
                        
                        // If not, create it
                        if (!option) {
                            option = new Option(this.clientCreatedForProject, this.clientCreatedForProject);
                            clientSelect.add(option);
                        }
                        
                        // Select it
                        clientSelect.value = this.clientCreatedForProject;
                    }
                    this.clientCreatedForProject = null;
                }
            }, 300);
        } else {
            this.displayClientsView(); // Refresh the clients view
        }
    }

    confirmDeleteClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) {
            showNotification('הלקוח לא נמצא', 'error');
            return;
        }
        
        // Check if client has associated projects
        const associatedProjects = this.projects.filter(p => p.client === client.name);
        if (associatedProjects.length > 0) {
            showNotification(`לא ניתן למחוק את הלקוח. קיימים ${associatedProjects.length} פרויקטים משויכים.`, 'error');
            return;
        }
        
        // Set the client ID on the confirmation button
        document.getElementById('confirm-delete-client').setAttribute('data-id', clientId);
        
        // Show modal
        document.getElementById('client-delete-modal').classList.remove('hidden');
    }

    deleteClient(clientId) {
        this.clients = this.clients.filter(c => c.id !== clientId);
        this.saveData();
        this.closeDeleteModal('client');
        this.displayClientsView();
        showNotification('הלקוח נמחק בהצלחה', 'success');
    }

    toggleArchiveClient(clientId) {
        const clientIndex = this.clients.findIndex(c => c.id === clientId);
        if (clientIndex === -1) {
            showNotification('הלקוח לא נמצא', 'error');
            return;
        }
        
        // Toggle archived status
        this.clients[clientIndex].isArchived = !this.clients[clientIndex].isArchived;
        this.saveData();
        this.displayClientsView();
        
        showNotification(
            this.clients[clientIndex].isArchived 
                ? 'הלקוח הועבר לארכיון בהצלחה' 
                : 'הלקוח שוחזר מהארכיון בהצלחה',
            'success'
        );
    }

    viewClientDetails(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) {
            showNotification('הלקוח לא נמצא', 'error');
            return;
        }
        
        const stats = this.calculateClientStats(client);
        const clientProjects = this.projects.filter(p => p.client === client.name);
        
        // Get client work logs
        const clientLogs = workLogs.filter(log => 
            log.client === client.name && log.type === 'work'
        );
        
        // Get the last 5 work records
        const recentLogs = clientLogs
            .sort((a, b) => DateTime.fromISO(b.date).toMillis() - DateTime.fromISO(a.date).toMillis())
            .slice(0, 5);
            
        document.getElementById('client-details-title').textContent = `פרטי לקוח: ${client.name}`;
        
        const detailsContent = document.getElementById('client-details-content');
        detailsContent.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 class="text-lg font-medium mb-4">פרטי לקוח</h4>
                    <dl class="grid grid-cols-3 gap-4">
                        <dt class="text-sm font-medium text-gray-500">שם הלקוח:</dt>
                        <dd class="text-sm text-gray-900 col-span-2">${this.escapeHtml(client.name)}</dd>
                        
                        <dt class="text-sm font-medium text-gray-500">איש קשר:</dt>
                        <dd class="text-sm text-gray-900 col-span-2">${this.escapeHtml(client.contactPerson) || '-'}</dd>
                        
                        <dt class="text-sm font-medium text-gray-500">דוא"ל:</dt>
                        <dd class="text-sm text-gray-900 col-span-2">
                            ${client.email ? `<a href="mailto:${client.email}" class="text-indigo-600 hover:text-indigo-900">${this.escapeHtml(client.email)}</a>` : '-'}
                        </dd>
                        
                        <dt class="text-sm font-medium text-gray-500">טלפון:</dt>
                        <dd class="text-sm text-gray-900 col-span-2 ltr">
                            ${client.phone ? `<a href="tel:${client.phone}" class="text-indigo-600 hover:text-indigo-900">${this.escapeHtml(client.phone)}</a>` : '-'}
                        </dd>
                        
                        <dt class="text-sm font-medium text-gray-500">כתובת:</dt>
                        <dd class="text-sm text-gray-900 col-span-2">${this.escapeHtml(client.address) || '-'}</dd>
                        
                        ${client.notes ? `
                        <dt class="text-sm font-medium text-gray-500">הערות:</dt>
                        <dd class="text-sm text-gray-900 col-span-2">${this.escapeHtml(client.notes)}</dd>
                        ` : ''}
                    </dl>
                    
                    <div class="mt-6 flex gap-2">
                        <button onclick="navigationSystem.editClient('${client.id}')" 
                                class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <svg class="mr-2 -ml-1 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            ערוך לקוח
                        </button>
                        
                        <button onclick="navigationSystem.openNewProjectModal('${client.name}')" 
                                class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <svg class="mr-2 -ml-1 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            פרויקט חדש
                        </button>
                    </div>
                </div>
                
                <div>
                    <h4 class="text-lg font-medium mb-4">סיכום פעילות</h4>
                    
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <dt class="text-sm font-medium text-gray-500">סה"כ שעות</dt>
                            <dd class="mt-1 text-2xl font-semibold text-indigo-600">${stats.totalHours.toFixed(1)}</dd>
                        </div>
                        
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <dt class="text-sm font-medium text-gray-500">פרויקטים פעילים</dt>
                            <dd class="mt-1 text-2xl font-semibold text-indigo-600">${stats.activeProjects}</dd>
                        </div>
                    </div>
                    
                    <h4 class="text-md font-medium mb-2">פרויקטים (${clientProjects.length})</h4>
                    ${clientProjects.length === 0 ? 
                        '<p class="text-sm text-gray-500">אין פרויקטים להצגה</p>' :
                        `<ul class="divide-y divide-gray-200">
                            ${clientProjects.map(project => `
                                <li class="py-2">
                                    <div class="flex justify-between">
                                        <span class="text-sm font-medium">${this.escapeHtml(project.name)}</span>
                                        <span class="text-xs px-2 py-1 rounded-full ${
                                            project.status === 'active' ? 'bg-green-100 text-green-800' :
                                            project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                            project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }">${
                                            project.status === 'active' ? 'פעיל' :
                                            project.status === 'completed' ? 'הושלם' :
                                            project.status === 'on-hold' ? 'בהמתנה' :
                                            'בוטל'
                                        }</span>
                                    </div>
                                    <p class="text-xs text-gray-500 mt-1">תעריף שעתי: ₪${project.hourlyRate || 0}</p>
                                </li>
                            `).join('')}
                        </ul>`
                    }
                    
                    <h4 class="text-md font-medium mt-4 mb-2">דיווחי עבודה אחרונים</h4>
                    ${recentLogs.length === 0 ? 
                        '<p class="text-sm text-gray-500">אין דיווחי עבודה להצגה</p>' :
                        `<ul class="divide-y divide-gray-200">
                            ${recentLogs.map(log => {
                                const date = DateTime.fromISO(log.date);
                                const duration = this.calculateLogDuration(log);
                                return `
                                    <li class="py-2">
                                        <div class="flex justify-between">
                                            <span class="text-sm">${date.toFormat('dd/MM/yyyy')}</span>
                                            <span class="text-sm text-gray-500">${log['start-time']} - ${log['end-time']}</span>
                                        </div>
                                        <p class="text-xs text-gray-500 mt-1">משך: ${duration.toFixed(1)} שעות, מיקום: ${this.escapeHtml(log.location)}</p>
                                    </li>
                                `;
                            }).join('')}
                        </ul>`
                    }
                </div>
            </div>
        `;
        
        document.getElementById('client-details-modal').classList.remove('hidden');
    }

    closeClientDetailsModal() {
        document.getElementById('client-details-modal').classList.add('hidden');
    }

    calculateLogDuration(log) {
        const start = DateTime.fromFormat(log['start-time'], 'HH:mm');
        const end = DateTime.fromFormat(log['end-time'], 'HH:mm');
        return end.diff(start, 'hours').hours;
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Initialize everything when DOM is loaded
    static init() {
        window.navigationSystem = new NavigationSystem();
        
        // Set up helper function for notifications
        window.showNotification = function(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg transform transition-all duration-500 z-50 ${
                type === 'success' ? 'bg-green-500' :
                type === 'warning' ? 'bg-yellow-500' :
                type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            } text-white`;
            
            notification.innerHTML = `
                <div class="flex items-center gap-2">
                    <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                        ${type === 'success' ? 
                            '<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>' :
                            type === 'error' ?
                            '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>' :
                            '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>'
                        }
                    </svg>
                    <span>${message}</span>
                    <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            `;

            document.body.appendChild(notification);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                notification.classList.add('opacity-0', 'translate-y-[-20px]');
                setTimeout(() => notification.remove(), 500);
            }, 5000);
        };
    }
}

// Add dark mode support if needed
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the navigation system
    NavigationSystem.init();
    
    // Create a global function to show confirmation dialogs
    window.showConfirmDialog = function(title, message) {
        return new Promise((resolve) => {
            const existingModal = document.getElementById('confirm-dialog');
            if (existingModal) {
                existingModal.remove();
            }
            
            const dialog = document.createElement('div');
            dialog.id = 'confirm-dialog';
            dialog.className = 'fixed inset-0 flex items-center justify-center z-50';
            dialog.innerHTML = `
                <div class="fixed inset-0 bg-black opacity-50"></div>
                <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative z-10">
                    <h3 class="text-lg font-semibold mb-2">${title}</h3>
                    <p class="text-gray-600 mb-6">${message}</p>
                    <div class="flex justify-end gap-4">
                        <button class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cancel-btn">ביטול</button>
                        <button class="px-4 py-2 bg-indigo-500 text-white hover:bg-indigo-600 rounded-lg confirm-btn">אישור</button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);

            dialog.querySelector('.confirm-btn').addEventListener('click', () => {
                dialog.remove();
                resolve(true);
            });

            dialog.querySelector('.cancel-btn').addEventListener('click', () => {
                dialog.remove();
                resolve(false);
            });
            
            // Allow clicking outside to cancel
            dialog.querySelector('.fixed.inset-0.bg-black').addEventListener('click', () => {
                dialog.remove();
                resolve(false);
            });
        });
    };
});