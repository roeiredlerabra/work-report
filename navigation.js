class NavigationSystem {
    constructor() {
        this.currentView = 'home';
        this.initializeNavigation();
        this.loadData();
    }

    // Data Management
    loadData() {
        this.projects = JSON.parse(localStorage.getItem('projects') || '[]');
        this.clients = JSON.parse(localStorage.getItem('clients') || '[]');
    }

    saveData() {
        localStorage.setItem('projects', JSON.stringify(this.projects));
        localStorage.setItem('clients', JSON.stringify(this.clients));
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

        const totalHours = this.calculateDailyHours(monthLogs);
        const workDays = new Set(monthLogs.map(log => log.date)).size;

        return {
            totalHours,
            workDays,
            totalDays: endOfMonth.day,
            averageHoursPerDay: workDays ? totalHours / workDays : 0,
            locations: this.calculateTypeDistribution(monthLogs),
            types: this.calculateTypeDistribution(monthLogs),
            clientStats: this.calculateClientStatistics(monthLogs),
            dailyHours: this.calculateDailyHours(monthLogs)
        };
    }

    calculateTypeDistribution(logs) {
        return logs.reduce((acc, log) => {
            acc[log.type] = (acc[log.type] || 0) + 1;
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
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-semibold mb-2">סה"כ שעות עבודה</h3>
                    <p class="text-3xl font-bold">${Number(stats.totalHours).toFixed(1)}</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-semibold mb-2">מספר ימי עבודה</h3>
                    <p class="text-3xl font-bold">${stats.workDays}</p>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-semibold mb-2">ממוצע שעות ליום</h3>
                    <p class="text-3xl font-bold">${Number(stats.averageHoursPerDay).toFixed(1)}</p>
                </div>
            </div>
            <!-- Add more report sections as needed -->
        `;
    }

    // Projects View
    displayProjectsView() {
        const reportContent = document.getElementById('report-content');
        reportContent.innerHTML = this.generateProjectsHTML();
        this.initializeProjectHandlers = () => {};
        this.initializeProjectHandlers();
    }

    generateProjectsHTML() {
        return `
            <div class="mb-6 flex justify-between items-center">
                <h2 class="text-2xl font-semibold">ניהול פרויקטים</h2>
                <button onclick="navigationSystem.openNewProjectModal()" 
                        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    פרויקט חדש
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="projects-grid">
                ${this.generateProjectCards()}
            </div>
            ${this.generateProjectModalHTML()}
        `;
    }

    generateProjectCards() {
        if (!this.projects.length) {
            return `
                <div class="col-span-full text-center py-12 bg-gray-50 rounded-lg">
                    <p class="text-gray-500">אין פרויקטים להצגה</p>
                    <button onclick="navigationSystem.openNewProjectModal()" 
                            class="mt-4 text-blue-600 hover:text-blue-700">
                        צור פרויקט חדש
                    </button>
                </div>
            `;
        }

        return this.projects.map(project => {
            const stats = this.calculateProjectStats(project);
            return `
                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-lg font-semibold">${project.name}</h3>
                        <div class="flex gap-2">
                            <button onclick="navigationSystem.editProject('${project.id}')" 
                                    class="text-blue-600 hover:text-blue-700">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                            </button>
                            <button onclick="navigationSystem.deleteProject('${project.id}')"
                                    class="text-red-600 hover:text-red-700">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <p class="text-gray-600 text-sm mb-2">לקוח: ${project.client}</p>
                    <p class="text-gray-500 text-sm">${project.description || 'אין תיאור'}</p>
                    <div class="mt-4 pt-4 border-t">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p class="text-gray-500">סה"כ שעות</p>
                                <p class="font-semibold">${stats.totalHours.toFixed(1)}</p>
                            </div>
                            <div>
                                <p class="text-gray-500">תעריף שעתי</p>
                                <p class="font-semibold">₪${project.hourlyRate || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    generateProjectModalHTML() {
        return `
            <div id="project-modal" class="modal hidden fixed inset-0 z-50">
                <div class="modal-overlay absolute inset-0 bg-black opacity-50"></div>
                <div class="modal-container fixed inset-0 flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div class="p-6">
                            <h3 class="text-xl font-semibold mb-4" id="project-modal-title">פרויקט חדש</h3>
                            <form id="project-form" class="space-y-4">
                                <input type="hidden" name="projectId" id="project-id">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">שם הפרויקט</label>
                                    <input type="text" name="projectName" id="project-name" required
                                           class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">לקוח</label>
                                    <select name="client" id="project-client" required 
                                            class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                                        <option value="">בחר לקוח</option>
                                        ${this.generateClientOptions()}
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
                                    <textarea name="description" id="project-description" rows="3"
                                              class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">תעריף שעתי</label>
                                    <input type="number" name="hourlyRate" id="project-rate" min="0"
                                           class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                                </div>
                                <div class="flex justify-end gap-3 mt-6">
                                    <button type="button" onclick="navigationSystem.closeProjectModal()"
                                            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                        ביטול
                                    </button>
                                    <button type="submit"
                                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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

    generateClientOptions() {
        const uniqueClients = [...new Set(workLogs.map(log => log.client))];
        return uniqueClients.map(client => 
            `<option value="${client}">${client}</option>`
        ).join('');
    }

    // Clients View
    displayClientsView() {
        const reportContent = document.getElementById('report-content');
        reportContent.innerHTML = this.generateClientsHTML();
        this.initializeClientHandlers();
    }

    generateClientsHTML() {
        return `
            <div class="mb-6 flex justify-between items-center">
                <h2 class="text-2xl font-semibold">ניהול לקוחות</h2>
                <button onclick="navigationSystem.openNewClientModal()" 
                        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    לקוח חדש
                </button>
            </div>
            <div class="bg-white rounded-lg shadow-md overflow-x-auto">
                <div class="p-4 border-b">
                    <div class="relative">
                        <input type="text" 
                               id="client-search" 
                               placeholder="חיפוש לקוחות..."
                               class="w-full p-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <svg class="w-5 h-5 text-gray-400 absolute left-3 top-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                        </svg>
                    </div>
                </div>
                            <div id="clients-list" class="divide-y">
                                ${this.generateClientsTable()}
                            </div>
                        </div>
                    `;
                }
                    
                    generateClientsTable() {
        const uniqueClients = this.getUniqueClients();
        
        if (uniqueClients.length === 0) {
            return `
                <div class="text-center py-12">
                    <p class="text-gray-500">אין לקוחות להצגה</p>
                    <button onclick="navigationSystem.openNewClientModal()" 
                            class="mt-4 text-blue-600 hover:text-blue-700">
                        צור לקוח חדש
                    </button>
                </div>
            `;
        }

        return `
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
                            סה"כ שעות
                        </th>
                        <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            פרויקטים פעילים
                        </th>
                        <th scope="col" class="relative px-6 py-3">
                            <span class="sr-only">פעולות</span>
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${uniqueClients.map(client => this.generateClientRow(client)).join('')}
                </tbody>
            </table>
        `;
    }

    generateClientRow(client) {
        const stats = this.calculateClientStats(client);
        return `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${client.name}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${client.contactPerson || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${stats.totalHours.toFixed(1)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${stats.activeProjects}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="navigationSystem.editClient('${client.id}')" 
                            class="text-indigo-600 hover:text-indigo-900 ml-4">
                        ערוך
                    </button>
                    <button onclick="navigationSystem.deleteClient('${client.id}')" 
                            class="text-red-600 hover:text-red-900">
                        מחק
                    </button>
                </td>
            </tr>
        `;
    }

    // Project Management Methods
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

    openNewProjectModal() {
        const modal = document.getElementById('project-modal');
        document.getElementById('project-modal-title').textContent = 'פרויקט חדש';
        document.getElementById('project-form').reset();
        document.getElementById('project-id').value = '';
        modal.classList.remove('hidden');
    }

    closeProjectModal() {
        const modal = document.getElementById('project-modal');
        modal.classList.add('hidden');
    }

    handleProjectFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const projectId = formData.get('projectId');
        
        const projectData = {
            id: projectId || Date.now().toString(),
            name: formData.get('projectName'),
            client: formData.get('client'),
            description: formData.get('description'),
            hourlyRate: formData.get('hourlyRate'),
            updatedAt: new Date().toISOString()
        };

        if (projectId) {
            // Update existing project
            const index = this.projects.findIndex(p => p.id === projectId);
            if (index !== -1) {
                this.projects[index] = { ...this.projects[index], ...projectData };
            }
        } else {
            // Add new project
            projectData.createdAt = new Date().toISOString();
            projectData.status = 'active';
            this.projects.push(projectData);
        }

        this.saveData();
        this.closeProjectModal();
        this.displayProjectsView();
        showNotification(
            projectId ? 'הפרויקט עודכן בהצלחה' : 'הפרויקט נוצר בהצלחה',
            'success'
        );
    }

    async deleteProject(projectId) {
        const confirmed = await showConfirmDialog(
            'מחיקת פרויקט',
            'האם אתה בטוח שברצונך למחוק פרויקט זה? פעולה זו אינה הפיכה.'
        );

        if (confirmed) {
            this.projects = this.projects.filter(p => p.id !== projectId);
            this.saveData();
            this.displayProjectsView();
            showNotification('הפרויקט נמחק בהצלחה', 'success');
        }
    }

    // Client Management Methods
    calculateClientStats(client) {
        const clientName = client.name || client;
        const clientLogs = workLogs.filter(log => 
            log.client === clientName && log.type === 'work'
        );

        const totalHours = clientLogs.reduce((sum, log) => {
            const start = DateTime.fromFormat(log['start-time'], 'HH:mm');
            const end = DateTime.fromFormat(log['end-time'], 'HH:mm');
            return sum + end.diff(start, 'hours').hours;
        }, 0);

        const activeProjects = this.projects.filter(p => 
            p.client === clientName && p.status !== 'completed'
        ).length;

        return { totalHours, activeProjects };
    }

    getUniqueClients() {
        const workLogClients = [...new Set(workLogs.map(log => log.client))];
        const allClients = [...this.clients];
        
        workLogClients.forEach(clientName => {
            if (!allClients.find(c => c.name === clientName)) {
                allClients.push({
                    id: Date.now().toString() + Math.random().toString(36).substring(2),
                    name: clientName 
                });
            }
        });
        
        return allClients;
    }

    initializeClientHandlers() {
        // Add event listeners or any initialization logic for client-related elements
        document.getElementById('client-search').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const clients = document.querySelectorAll('#clients-list tr');
            clients.forEach(client => {
                const clientName = client.querySelector('td').textContent.toLowerCase();
                if (clientName.includes(searchTerm)) {
                    client.style.display = '';
                } else {
                    client.style.display = 'none';
                }
            });
        });
    }

    // Initialize everything when DOM is loaded
    static init() {
        window.navigationSystem = new NavigationSystem();
        
        // Add dark mode support
        if (document.documentElement.classList.contains('dark')) {
            document.querySelectorAll('.bg-white').forEach(el => {
                el.classList.remove('bg-white');
                el.classList.add('bg-gray-800');
            });
        }
    }
}

// Initialize the navigation system when DOM is loaded
document.addEventListener('DOMContentLoaded', NavigationSystem.init);