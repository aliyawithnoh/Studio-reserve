


/**
 * Booking Modal Component
 * Handles booking request form
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
    }

    init() {
        this.attachEventListeners();
    }

    open() {
        const today = new Date();
        const todayStr = getLocalISODate(today);
        const selectedDateStr = getLocalISODate(state.selectedDate);

        document.getElementById('req-date').value = selectedDateStr;
        document.getElementById('req-date').min = todayStr;
        document.getElementById('req-appointment-date').value = selectedDateStr;
        document.getElementById('req-appointment-date').min = todayStr;

        this.modal.classList.add('active');
    }

    close() {
        this.modal.classList.remove('active');
        this.form.reset();
        this.durationInfo.style.display = 'none';
        this.conflictWarning.style.display = 'none';
    }

    updateDurationInfo() {
        const startTime = document.getElementById('req-start-time').value;
        const endTime = document.getElementById('req-end-time').value;
        const appointmentDate = document.getElementById('req-appointment-date').value;
        const appointmentTime = document.getElementById('req-appointment').value;

        if (startTime && endTime && startTime < endTime) {
            const start = parseInt(startTime.split(':')[0]);
            const end = parseInt(endTime.split(':')[0]);
            const duration = end - start;

            let html = `<div><strong>Room Usage Duration:</strong> ${duration} hour${duration > 1 ? 's' : ''} (${convertTo12Hour(startTime)} - ${convertTo12Hour(endTime)})</div>`;

            if (appointmentDate && appointmentTime) {
                const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                });
                html += `<div><strong>Confirmation Meeting:</strong> ${formattedDate} at ${convertTo12Hour(appointmentTime)}</div>`;
            }

            this.durationInfo.innerHTML = html;
            this.durationInfo.style.display = 'block';
        } else {
            this.durationInfo.style.display = 'none';
        }

        this.checkTimeConflict();
    }

    checkTimeConflict() {
        const date = document.getElementById('req-date').value;
        const startTime = document.getElementById('req-start-time').value;
        const endTime = document.getElementById('req-end-time').value;

        if (!date || !startTime || !endTime || startTime >= endTime) {
            this.conflictWarning.style.display = 'none';
            return;
        }

        const conflict = findConflict(state.selectedRoom.id, date, startTime, endTime);

        if (conflict) {
            this.conflictWarning.innerHTML = `
                <div style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 0.25rem;">⚠️ Time Conflict Detected</div>
                        <div style="font-size: 0.875rem;">
                            This time slot (${convertTo12Hour(startTime)} - ${convertTo12Hour(endTime)}) conflicts with an existing booking.
                        </div>
                    </div>
                </div>
                <div style="background-color: #fee2e2; padding: 0.75rem; border-radius: 0.25rem; margin-bottom: 0.5rem;">
                    <div style="font-size: 0.875rem; margin-bottom: 0.5rem;">
                        <strong>Current Reservation by:</strong> ${conflict.name}
                    </div>
                    <div style="font-size: 0.875rem; margin-bottom: 0.5rem;">
                        <strong>Contact:</strong> ${conflict.contact}
                    </div>
                    <div style="font-size: 0.75rem; padding-top: 0.5rem; border-top: 1px solid #fca5a5;">
                        <strong>Reserved Time:</strong> ${convertTo12Hour(conflict.startTime)} - ${convertTo12Hour(conflict.endTime)}
                    </div>
                </div>
            `;
            this.conflictWarning.style.display = 'block';
        } else {
            this.conflictWarning.style.display = 'none';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('req-name').value,
            email: document.getElementById('req-email').value,
            date: document.getElementById('req-date').value,
            startTime: document.getElementById('req-start-time').value,
            endTime: document.getElementById('req-end-time').value,
            appointmentDate: document.getElementById('req-appointment-date').value,
            appointmentTime: document.getElementById('req-appointment').value,
            contact: document.getElementById('req-contact').value,
            attendees: parseInt(document.getElementById('req-attendees').value),
            purpose: document.getElementById('req-purpose').value
        };

        // Validation
        if (isPastDate(new Date(formData.date))) {
            showToast('Cannot book rooms for past dates', 'error');
            return;
        }

        if (formData.startTime >= formData.endTime) {
            showToast('End time must be after start time', 'error');
            return;
        }

        if (formData.attendees > state.selectedRoom.capacity) {
            showToast(`Number of attendees exceeds room capacity (${state.selectedRoom.capacity})`, 'error');
            return;
        }

        const newRequest = {
            id: Date.now().toString(),
            roomId: state.selectedRoom.id,
            roomName: state.selectedRoom.name,
            ...formData
        };

        const saved = await saveBookingRequest(newRequest);

        if (saved) {
            // IMPORTANT: Do NOT call addBooking(newRequest) here.
            // The booking starts as 'pending' and should NOT appear on the calendar immediately.
            // It will only appear after Admin accepts it and the data is reloaded.
            
            showToast(`Request submitted! Waiting for admin approval.`, 'success');
            this.close();

            // Re-render components to reflect any state changes (though new booking won't be visible yet)
            const calendar = new Calendar();
            calendar.render();

            const timeSlots = new TimeSlots();
            timeSlots.render();
        } else {
            showToast('Failed to save request. Please try again.', 'error');
        }
    }

    attachEventListeners() {
        const requestBtn = document.getElementById('request-btn');
        const modalClose = document.getElementById('modal-close');
        const cancelBtn = document.getElementById('cancel-btn');

        if (requestBtn) requestBtn.addEventListener('click', () => this.open());
        if (modalClose) modalClose.addEventListener('click', () => this.close());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.close());
        if (this.form) this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        const startTime = document.getElementById('req-start-time');
        const endTime = document.getElementById('req-end-time');
        const appointmentTime = document.getElementById('req-appointment');
        const appointmentDate = document.getElementById('req-appointment-date');
        const reqDate = document.getElementById('req-date');

        if (startTime) startTime.addEventListener('change', () => this.updateDurationInfo());
        if (endTime) endTime.addEventListener('change', () => this.updateDurationInfo());
        if (appointmentTime) appointmentTime.addEventListener('change', () => this.updateDurationInfo());
        if (appointmentDate) appointmentDate.addEventListener('change', () => this.updateDurationInfo());
        if (reqDate) reqDate.addEventListener('change', () => this.checkTimeConflict());
    }
}
