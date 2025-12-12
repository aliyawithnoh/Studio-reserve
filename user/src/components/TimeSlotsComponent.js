
/**
 * Time Slots Component
 * Displays booked slots first (grouped), then available slots.
 */

import { state } from '../core/state.js';
import { formatDate, formatTimeSlot, getLocalISODate, convertTo12Hour } from '../utils/dateUtils.js';
import { getAvailableSlots, getBookingsForDate } from '../services/bookingService.js';

export class TimeSlots {
    constructor() {
        this.container = document.getElementById('timeslots-container');
        this.dateText = document.getElementById('selected-date-text');
    }

    render() {
        if (!this.container) return;

        // Update Header Date
        if (this.dateText) {
            this.dateText.textContent = formatDate(state.selectedDate);
        }

        const dateStr = getLocalISODate(state.selectedDate);
        
        // Fetch Data
        const availableSlots = getAvailableSlots(state.selectedRoom.id, dateStr);
        const dayBookings = getBookingsForDate(state.selectedRoom.id, dateStr);

        // Sort bookings by start time
        dayBookings.sort((a, b) => a.startTime.localeCompare(b.startTime));

        let html = '';

        // --- 1. BOOKED SLOTS (Grouped) ---
        html += `<div class="timeslot-section">
                    <div class="timeslot-header">Booked (${dayBookings.length})</div>
                    <div class="timeslot-list">`;

        if (dayBookings.length > 0) {
            dayBookings.forEach(booking => {
                const start12 = convertTo12Hour(booking.startTime);
                const end12 = convertTo12Hour(booking.endTime);
                
                html += `
                    <div class="timeslot timeslot-booked">
                        <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <div style="flex: 1;">
                            <div style="font-weight: 600;">${start12} - ${end12}</div>
                            <div class="timeslot-info">${booking.purpose}</div>
                            <div class="timeslot-info" style="opacity: 0.8; font-size: 0.75rem;">${booking.name}</div>
                        </div>
                    </div>
                `;
            });
        } else {
            html += `<div class="empty-slots">No bookings for this date</div>`;
        }
        html += `</div></div>`;

        // --- 2. AVAILABLE SLOTS ---
        html += `<div class="timeslot-section">
                    <div class="timeslot-header">Available (${availableSlots.length})</div>
                    <div class="timeslot-list">`;

        if (availableSlots.length > 0) {
            availableSlots.forEach(slot => {
                html += `
                    <div class="timeslot timeslot-available">
                        <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>${formatTimeSlot(slot)}</span>
                    </div>
                `;
            });
        } else {
            html += `<div class="empty-slots">Fully Booked</div>`;
        }
        html += `</div></div>`;

        this.container.innerHTML = html;
    }
}
