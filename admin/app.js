
/**
 * Admin Dashboard Application
 * Handles data fetching, UI rendering, and booking management.
 */

// State
let requests = [];
let rooms = [];
let currentCalendarDate = new Date();
let selectedRequestToEdit = null;

// Constants
const API_URL = 'http://localhost:3000/api';
const LOCAL_STORAGE_KEY = 'requests'; // Shared key with User App

// DOM Elements
const tabs = document.querySelectorAll('.tab-trigger');
const tabContents = document.querySelectorAll('.tab-content');
const queueTableBody = document.getElementById('queueTableBody');
const historyTableBody = document.getElementById('historyTableBody');
const pendingCountEl = document.getElementById('pendingCount');
const historyCountEl = document.getElementById('historyCount');
const toastContainer = document.getElementById('toastContainer');

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    setupTabs();
    setupModals();
    setupFilters();
    setupCalendarControls();
    setupEditListeners();
    await loadData();
    renderAll();
    
    // Auto-refresh every 30 seconds
    setInterval(loadData, 30000);
});

function checkAuth() {
    if (!sessionStorage.getItem('bchs_admin_logged_in')) {
        window.location.href = 'login.html';
    }
}

function logout() {
    sessionStorage.removeItem('bchs_admin_logged_in');
    window.location.href = 'login.html';
}

// Data Loading
async function loadData() {
    try {
        await loadRooms();
        await loadRequests();
        updateStats();
        renderQueue();
        renderHistory();
        renderCalendar();
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Failed to load data', 'error');
    }
}

async function loadRooms() {
    try {
        // Try relative path (works if served via static server) or fall back to /data
        const response = await fetch('../data/rooms.json').catch(() => fetch('/data/rooms.json'));
        if (response.ok) {
            const data = await response.json();
            rooms = data.rooms || [];
        } else {
            throw new Error('Failed to fetch rooms');
        }
    } catch (e) {
        console.warn('Using fallback rooms data');
        rooms = [
            { id: 'auditorium', name: 'Auditorium', capacity: 1000 },
            { id: 'library', name: 'Library', capacity: 100 },
            { id: 'grounds', name: 'Grounds', capacity: 1800 },
            { id: 'avr', name: 'AVR', capacity: 150 },
            { id: 'gym', name: 'Gym', capacity: 2000 }
        ];
    }
}

async function loadRequests() {
    try {
        // 1. Try API
        const response = await fetch(`${API_URL}/requests`);
        if (response.ok) {
            const data = await response.json();
            requests = data.requests || [];
            // Sync to local storage
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(requests));
            return;
        }
    } catch (e) {
        // console.log('API unavailable, checking LocalStorage...');
    }

    // 2. Try LocalStorage
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
        requests = JSON.parse(stored);
        return;
    }

    // 3. Try Static File
    try {
        const response = await fetch('../data/requests.json').catch(() => fetch('/data/requests.json'));
        if (response.ok) {
            const data = await response.json();
            requests = data.requests || [];
        }
    } catch (e) {
        console.error('No requests found');
        requests = [];
    }
}

// Tab Handling
function setupTabs() {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const target = document.getElementById(`${tab.dataset.tab}-tab`);
            if (target) target.classList.add('active');
        });
    });
}

function setupFilters() {
    // Add event listeners for filters if they exist
    ['roomFilter', 'statusFilter', 'paymentFilter', 'searchFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', renderAll);
    });
    
    ['queueRoomFilter', 'queueStatusFilter', 'queuePaymentFilter', 'queueSearchFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', renderQueue);
    });

    ['historyRoomFilter', 'historyStatusFilter', 'historySearch'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', renderHistory);
    });
}

function setupCalendarControls() {
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
}

function setupEditListeners() {
    document.getElementById('saveEdit').addEventListener('click', saveBookingChanges);
    document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
    document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
}

function renderAll() {
    renderQueue();
    renderHistory();
    updateStats();
    renderCalendar();
}

// Rendering
function renderQueue() {
    if (!queueTableBody) return;
    
    const roomFilter = document.getElementById('queueRoomFilter')?.value || 'all';
    const searchFilter = document.getElementById('queueSearchFilter')?.value.toLowerCase() || '';

    const pending = requests.filter(r => {
        const isPending = r.status === 'pending';
        const matchesRoom = roomFilter === 'all' || getRoomName(r.roomId) === roomFilter || r.roomId === roomFilter;
        const matchesSearch = !searchFilter || 
            (r.name && r.name.toLowerCase().includes(searchFilter)) || 
            (r.purpose && r.purpose.toLowerCase().includes(searchFilter));
        
        return isPending && matchesRoom && matchesSearch;
    });

    pendingCountEl.textContent = `${pending.length} pending`;

    if (pending.length === 0) {
        queueTableBody.innerHTML = '<tr><td colspan="11" class="text-center" style="padding: 20px; color: #6b7280;">No pending requests</td></tr>';
        return;
    }

    queueTableBody.innerHTML = pending.map(req => `
        <tr>
            <td>${formatDate(req.submittedAt)}</td>
            <td>${req.name}</td>
            <td>
                <div>${req.contact}</div>
                <div style="font-size: 0.8em; color: #666;">${req.email}</div>
            </td>
            <td><span class="badge badge-secondary">${getRoomName(req.roomId)}</span></td>
            <td>
                <div>${formatDate(req.date)}</div>
                <div style="font-size: 0.85em; font-weight: 500;">${convertTo12Hour(req.startTime)} - ${convertTo12Hour(req.endTime)}</div>
            </td>
            <td><div class="truncate" title="${req.purpose}">${req.purpose}</div></td>
            <td>${req.attendees}</td>
            <td>
                <div>${formatDate(req.appointmentDate)}</div>
                <div>${convertTo12Hour(req.appointmentTime)}</div>
            </td>
            <td>
                <span class="badge ${req.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}">
                    ${req.paymentStatus || 'pending'}
                </span>
            </td>
            <td><span class="badge badge-warning">Pending</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-success btn-sm" onclick="updateStatus('${req.id}', 'approved')">
                        Accept
                    </button>
                    <button class="btn btn-destructive btn-sm" onclick="updateStatus('${req.id}', 'rejected')">
                        Reject
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderHistory() {
    if (!historyTableBody) return;

    const roomFilter = document.getElementById('historyRoomFilter')?.value || 'all';
    const statusFilter = document.getElementById('historyStatusFilter')?.value || 'all';
    const searchFilter = document.getElementById('historySearch')?.value.toLowerCase() || '';

    const history = requests.filter(r => {
        const notPending = r.status !== 'pending';
        const matchesRoom = roomFilter === 'all' || getRoomName(r.roomId) === roomFilter || r.roomId === roomFilter;
        // Map status filter values (accepted/refused) to data values (approved/rejected) if necessary
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'accepted' && r.status === 'approved') ||
            (statusFilter === 'refused' && r.status === 'rejected') ||
            r.status === statusFilter;
            
        const matchesSearch = !searchFilter || 
            (r.name && r.name.toLowerCase().includes(searchFilter)) || 
            (r.purpose && r.purpose.toLowerCase().includes(searchFilter));

        return notPending && matchesRoom && matchesStatus && matchesSearch;
    });

    historyCountEl.textContent = `${history.length} records`;

    if (history.length === 0) {
        historyTableBody.innerHTML = '<tr><td colspan="11" class="text-center" style="padding: 20px; color: #6b7280;">No history records found</td></tr>';
        return;
    }

    historyTableBody.innerHTML = history.map(req => `
        <tr>
            <td>${formatDate(req.date)}</td>
            <td>${req.name}</td>
            <td>${req.contact}</td>
            <td>${getRoomName(req.roomId)}</td>
            <td>${convertTo12Hour(req.startTime)} - ${convertTo12Hour(req.endTime)}</td>
            <td><div class="truncate" title="${req.purpose}">${req.purpose}</div></td>
            <td>${req.attendees}</td>
            <td>${formatDate(req.appointmentDate)}</td>
            <td>${req.paymentStatus || '-'}</td>
            <td>
                <span class="badge ${req.status === 'approved' ? 'badge-success' : 'badge-destructive'}">
                    ${req.status === 'approved' ? 'Accepted' : 'Refused'}
                </span>
            </td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="openEditModal('${req.id}')">Edit</button>
            </td>
        </tr>
    `).join('');
}

function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar();
}

function renderCalendar() {
    const calendarEl = document.getElementById('calendar');
    const monthYearEl = document.getElementById('currentMonthYear');
    
    if (!calendarEl) return;

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    monthYearEl.textContent = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const approvedBookings = requests.filter(r => r.status === 'approved');

    let html = '';
    
    // Headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(d => html += `<div class="calendar-header-cell">${d}</div>`);

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayBookings = approvedBookings.filter(b => b.date === dateStr);
        const hasBooking = dayBookings.length > 0;
        
        let indicatorHtml = '';
        if (hasBooking) {
            indicatorHtml = `<div class="booking-dots">`;
            // Show up to 3 dots, then a plus
            dayBookings.slice(0, 3).forEach(() => {
                indicatorHtml += `<span class="dot"></span>`;
            });
            if (dayBookings.length > 3) indicatorHtml += `<span class="dot plus">+</span>`;
            indicatorHtml += `</div>`;
        }

        html += `
            <div class="calendar-day ${hasBooking ? 'has-bookings' : ''}" onclick="showDayDetails('${dateStr}')">
                <span class="day-number">${day}</span>
                ${indicatorHtml}
            </div>
        `;
    }

    calendarEl.innerHTML = html;
}

window.showDayDetails = function(dateStr) {
    const container = document.getElementById('selectedDateEvents');
    const label = document.getElementById('selectedDateLabel');
    const list = document.getElementById('dayBookingsList');
    
    if (!container || !list) return;

    const dayBookings = requests.filter(r => r.status === 'approved' && r.date === dateStr);
    
    label.textContent = formatDate(dateStr);
    container.style.display = 'block';
    
    if (dayBookings.length === 0) {
        list.innerHTML = '<p style="color: #6b7280; font-size: 14px;">No approved bookings for this day.</p>';
        return;
    }

    list.innerHTML = dayBookings.map(b => `
        <div class="booking-item-card" style="border: 1px solid #e5e7eb; padding: 10px; margin-bottom: 8px; border-radius: 6px; background: #f9fafb;">
            <div style="font-weight: 600; color: #374151;">${getRoomName(b.roomId)}</div>
            <div style="font-size: 14px; margin: 4px 0;"><strong>${b.name}</strong> - ${b.purpose}</div>
            <div style="font-size: 12px; color: #6b7280;">${convertTo12Hour(b.startTime)} - ${convertTo12Hour(b.endTime)}</div>
            <button class="btn btn-sm btn-outline" style="margin-top: 8px;" onclick="openEditModal('${b.id}')">Edit</button>
        </div>
    `).join('');
};

window.openEditModal = function(id) {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    
    selectedRequestToEdit = id;
    
    document.getElementById('editName').value = req.name || '';
    document.getElementById('editRoom').value = getRoomName(req.roomId); // Map ID to Name for select
    document.getElementById('editEmail').value = req.email || '';
    document.getElementById('editPhone').value = req.contact || '';
    document.getElementById('editDate').value = req.date || '';
    document.getElementById('editAttendees').value = req.attendees || 0;
    document.getElementById('editStartTime').value = req.startTime || '';
    document.getElementById('editEndTime').value = req.endTime || '';
    document.getElementById('editPurpose').value = req.purpose || '';
    
    // Format appointment date time for input type="datetime-local"
    const apptVal = (req.appointmentDate && req.appointmentTime) 
        ? `${req.appointmentDate}T${req.appointmentTime}` 
        : '';
    document.getElementById('editAppointment').value = apptVal;
    
    document.getElementById('editNotes').value = req.additionalNotes || '';
    
    // Map data status to form values
    let formStatus = 'pending';
    if (req.status === 'approved') formStatus = 'accepted';
    if (req.status === 'rejected') formStatus = 'refused';
    
    document.getElementById('editStatus').value = formStatus;
    document.getElementById('editPaymentStatus').value = req.paymentStatus || 'pending';

    const modal = document.getElementById('editModal');
    modal.classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    selectedRequestToEdit = null;
}

function saveBookingChanges() {
    if (!selectedRequestToEdit) return;
    
    const index = requests.findIndex(r => r.id === selectedRequestToEdit);
    if (index === -1) return;

    // Get values
    const roomName = document.getElementById('editRoom').value;
    // Reverse lookup ID from name, or fallback to lowercase name
    const roomObj = rooms.find(r => r.name === roomName);
    const roomId = roomObj ? roomObj.id : roomName.toLowerCase();
    
    const statusVal = document.getElementById('editStatus').value;
    const mappedStatus = statusVal === 'accepted' ? 'approved' : (statusVal === 'refused' ? 'rejected' : 'pending');

    const apptDateTime = document.getElementById('editAppointment').value;
    let apptDate = '', apptTime = '';
    if (apptDateTime) {
        // Split YYYY-MM-DDTHH:mm
        const parts = apptDateTime.split('T');
        if (parts.length === 2) {
            apptDate = parts[0];
            apptTime = parts[1];
        }
    }

    const updates = {
        name: document.getElementById('editName').value,
        roomId: roomId,
        roomName: roomName,
        email: document.getElementById('editEmail').value,
        contact: document.getElementById('editPhone').value,
        date: document.getElementById('editDate').value,
        attendees: parseInt(document.getElementById('editAttendees').value),
        startTime: document.getElementById('editStartTime').value,
        endTime: document.getElementById('editEndTime').value,
        purpose: document.getElementById('editPurpose').value,
        appointmentDate: apptDate,
        appointmentTime: apptTime,
        additionalNotes: document.getElementById('editNotes').value,
        status: mappedStatus,
        paymentStatus: document.getElementById('editPaymentStatus').value
    };

    // Update local array
    requests[index] = { ...requests[index], ...updates };
    
    // Save to storage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(requests));
    
    showToast('Booking updated successfully', 'success');
    closeEditModal();
    loadData(); // Refresh all views (calendar, lists)
}

function updateStats() {
    // Update dashboard counters
    const upcoming = requests.filter(r => r.status === 'approved' && new Date(r.date) >= new Date());
    const paid = requests.filter(r => r.paymentStatus === 'paid').length;
    const unpaid = requests.filter(r => r.paymentStatus === 'unpaid').length;
    
    const upcomingEl = document.getElementById('upcomingCount');
    const paidEl = document.getElementById('paidCount');
    const unpaidEl = document.getElementById('unpaidCount');

    if (upcomingEl) upcomingEl.textContent = `${upcoming.length} bookings`;
    if (paidEl) paidEl.textContent = paid;
    if (unpaidEl) unpaidEl.textContent = unpaid;
}

// Actions
window.updateStatus = async function(id, status) {
    if (!confirm(`Are you sure you want to ${status} this request?`)) return;

    const newStatus = status === 'approved' ? 'approved' : 'rejected';

    // 1. Try API
    try {
        await fetch(`${API_URL}/requests/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
    } catch (e) {
        console.warn('API update failed, processing locally');
    }

    // 2. Update Local State & Storage
    const index = requests.findIndex(r => r.id === id);
    if (index !== -1) {
        requests[index].status = newStatus;
        
        // Save to localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(requests));
        
        showToast(`Request ${newStatus}`, 'success');
        renderAll();
    } else {
        showToast('Request not found', 'error');
    }
};

// Utilities
function getRoomName(idOrName) {
    if (!idOrName) return '-';
    // If it's already a name like "Auditorium", return it
    const knownNames = ['Auditorium', 'Library', 'Grounds', 'AVR', 'Gym'];
    if (knownNames.includes(idOrName)) return idOrName;

    // Look up by ID
    const room = rooms.find(r => r.id === idOrName);
    return room ? room.name : idOrName;
}

function convertTo12Hour(time) {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString();
}

function showToast(message, type = 'info') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function setupModals() {
    const modal = document.getElementById('addEventModal');
    const btn = document.getElementById('addEventBtn');
    const close = document.getElementById('closeAddEventModal');
    
    if (btn && modal) btn.onclick = () => modal.classList.add('active');
    if (close && modal) close.onclick = () => modal.classList.remove('active');
    
    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('active');
        }
    };
}
