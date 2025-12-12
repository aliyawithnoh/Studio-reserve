
/**
 * Booking Modal Component
 * Handles booking request form interactions and validation
 */

import { state } from '../core/state.js';
import { convertTo12Hour, isPastDate, getLocalISODate } from '../utils/dateUtils.js';
import { saveBookingRequest, findConflict } from '../services/bookingService.js';
import { Calendar } from './CalendarComponent.js';
import { TimeSlots } from './TimeSlotsComponent.js';
import { showToast } from './NotificationComponent.js';

export class BookingModal {
    constructor() {
        this.modal = document.getElementById('request-modal');
        this.form = document.getElementById('request-form');
        this.durationInfo = document.getElementById('duration-info');
        this.conflictWarning = document.getElementById('conflict-warning');
        
        // Input References
        this.inputs = {
            name: document.getElementById('req-name'),
            email: document.getElementById('req-email'),
            contact: document.getElementById('req-contact'),
            date: document.getElementById('req-date'),
            attendees: document.getElementById('req-attendees'),
            purpose: document.getElementById('req-purpose'),
            startTime: document.getElementById('req-start-time'),
            endTime: document.getElementById('req-end-time'),
            apptDate: document.getElementById('req-appointment-date'),
            apptTime: document.getElementById('req-appointment')
        };
    }

    init() {
        this.attachEventListeners();
    }

    open() {
        const today = new Date();
        const todayStr = getLocalISODate(today);
        const selectedDateStr = getLocalISODate(state.selectedDate);

        // Pre-fill date fields
        if (this.inputs.date) {
            this.inputs.date.value = selectedDateStr;
            this.inputs.date.min = todayStr;
        }
        
        if (this.inputs.apptDate) {
            this.inputs.apptDate.value = ''; // Reset confirmation date
            this.inputs.apptDate.min = todayStr;
        }

        this.updateDurationInfo();
        this.checkTimeConflict();
        this.modal.classList.add('active');
    }

    close() {
        this.modal.classList.remove('active');
        this.form.reset();
        this.durationInfo.style.display = 'none';
        this.conflictWarning.style.display = 'none';
    }

    attachEventListeners() {
        // UI Controls
        const requestBtn = document.getElementById('request-btn');
        const modalClose = document.getElementById('modal-close');
        const cancelBtn = document.getElementById('cancel-btn');

        if (requestBtn) requestBtn.addEventListener('click', () => this.open());
        if (modalClose) modalClose.addEventListener('click', () => this.close());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.close());
        
        // Form Submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Change Listeners for Validation
        const { startTime, endTime, apptTime, apptDate, date } = this.inputs;

        [startTime, endTime, apptTime, apptDate].forEach(el => {
            if (el) el.addEventListener('change', () => this.updateDurationInfo());
        });

        if (date) {
            date.addEventListener('change', () => this.checkTimeConflict());
        }

        // Weekday Enforcement for Confirmation Date
        if (apptDate) {
            apptDate.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val) {
                    const d = new Date(val);
                    // Use getUTCDay() if the input string is parsed as UTC, 
                    // but standard Date(YYYY-MM-DD) parses as UTC midnight.
                    // To be safe regarding timezone, let's create the date using local parts.
                    const [y, m, day] = val.split('-').map(Number);
                    const dateObj = new Date(y, m - 1, day);
                    const dayOfWeek = dateObj.getDay();

                    // 0 = Sunday, 6 = Saturday
                    if (dayOfWeek === 0 || dayOfWeek === 6) {
                        e.target.value = ''; 
                        showToast('Confirmation visits are only available on Weekdays (Mon-Fri).', 'error');
                        this.updateDurationInfo();
                    }
                }
            });
        }
    }

    updateDurationInfo() {
        const start = this.inputs.startTime.value;
        const end = this.inputs.endTime.value;
        const apptDate = this.inputs.apptDate.value;
        const apptTime = this.inputs.apptTime.value;

        let infoHtml = '';

        if (start && end && start < end) {
            const startHour = parseInt(start.split(':')[0]);
            const endHour = parseInt(end.split(':')[0]);
            const duration = endHour - startHour;
            
            infoHtml += `<div><strong>Duration:</strong> ${duration} hour${duration > 1 ? 's' : ''}</div>`;
        }

        if (apptDate && apptTime) {
            const d = new Date(apptDate);
            // Format nice date
            const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            infoHtml += `<div style="margin-top:4px;"><strong>Confirmation:</strong> ${dateStr} at ${convertTo12Hour(apptTime)}</div>`;
        }

        if (infoHtml) {
            this.durationInfo.innerHTML = infoHtml;
            this.durationInfo.style.display = 'block';
        } else {
            this.durationInfo.style.display = 'none';
        }

        this.checkTimeConflict();
    }

    checkTimeConflict() {
        const date = this.inputs.date.value;
        const start = this.inputs.startTime.value;
        const end = this.inputs.endTime.value;

        if (!date || !start || !end || start >= end) {
            this.conflictWarning.style.display = 'none';
            return;
        }

        const conflict = findConflict(state.selectedRoom.id, date, start, end);

        if (conflict) {
            this.conflictWarning.innerHTML = `
                <strong>⚠️ Conflict Detected</strong><br>
                Room is booked by ${conflict.name} from ${convertTo12Hour(conflict.startTime)} to ${convertTo12Hour(conflict.endTime)}.
            `;
            this.conflictWarning.style.display = 'block';
        } else {
            this.conflictWarning.style.display = 'none';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        // Extract Data
        const formData = {
            name: this.inputs.name.value,
            email: this.inputs.email.value,
            contact: this.inputs.contact.value,
            date: this.inputs.date.value,
            startTime: this.inputs.startTime.value,
            endTime: this.inputs.endTime.value,
            attendees: parseInt(this.inputs.attendees.value),
            purpose: this.inputs.purpose.value,
            appointmentDate: this.inputs.apptDate.value,
            appointmentTime: this.inputs.apptTime.value,
        };

        // Logic Validations
        if (isPastDate(new Date(formData.date))) {
            showToast('Cannot book for past dates.', 'error');
            return;
        }

        if (formData.startTime >= formData.endTime) {
            showToast('Invalid time range.', 'error');
            return;
        }

        if (formData.attendees > state.selectedRoom.capacity) {
            showToast(`Attendees exceed room capacity (${state.selectedRoom.capacity}).`, 'error');
            return;
        }

        // Check Conflict again before submit
        const conflict = findConflict(state.selectedRoom.id, formData.date, formData.startTime, formData.endTime);
        if (conflict) {
            showToast('Time slot conflicts with an existing booking.', 'error');
            return;
        }

        // Construct Request Object
        const newRequest = {
            id: Date.now().toString(),
            roomId: state.selectedRoom.id,
            roomName: state.selectedRoom.name,
            ...formData,
            status: 'pending', // Explicitly pending
            submittedAt: new Date().toISOString()
        };

        // Save
        try {
            const success = await saveBookingRequest(newRequest);
            if (success) {
                showToast('Request submitted successfully! Waiting for Admin approval.', 'success');
                this.close();
                // Refresh UI components
                new Calendar().render();
                new TimeSlots().render();
            } else {
                showToast('System error saving request.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Network error.', 'error');
        }
    }
}
