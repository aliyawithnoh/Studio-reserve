
/**
 * Time Slots Component
 * Displays available and booked time slots
 */

import { state } from '../core/state.js';
import { formatDate, formatTimeSlot, getLocalISODate } from '../utils/dateUtils.js';
import { getAvailableSlots, getBookedSlots, getBookingsForDate } from '../services/bookingService.js';

export class TimeSlots {
    constructor() {
        this.container = document.getElementById('timeslots-container');
        this.dateText = document.getElementById('selected-date-text');
    }

    render() {
        if (!this.container) return;

        if (this.dateText) {
            this.dateText.textContent = formatDate(state.selectedDate);
        }

        // Use getLocalISODate instead of toISOString() to avoid UTC shifting
        // This ensures the date string matches the format in the database (YYYY-MM-DD)
        const dateStr = getLocalISODate(state.selectedDate);
        const availableSlots = getAvailableSlots(state.selectedRoom.id, dateStr);
        const bookedSlots = getBookedSlots(state.selectedRoom.id, dateStr);
        const dayBookings = getBookingsForDate(state.selectedRoom.id, dateStr);

        let html = `
            <div class="timeslot-section">
                <div class="timeslot-header">Available Time (${availableSlots.length} slots):</div>
                <div class="timeslot-list">
        `;

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
            html += '<div class="empty-slots">No available slots</div>';
        }

        html += `
                </div>
            </div>
            <div class="timeslot-section">
                <div class="timeslot-header">Booked Time (${bookedSlots.length} slots):</div>
                <div class="timeslot-list">
        `;

        if (bookedSlots.length > 0) {
            bookedSlots.forEach(slot => {
                const booking = this.findBookingForSlot(dayBookings, slot);

                html += `
                    <div class="timeslot timeslot-booked">
                        <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>${formatTimeSlot(slot)}</span>
                        ${booking ? `<div class="timeslot-info">${booking.name} - ${booking.purpose}</div>` : ''}
                    </div>
                `;
            });
        } else {
            html += '<div class="empty-slots">No bookings</div>';
        }

        html += `
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    }

    findBookingForSlot(bookings, slot) {
        const [startStr] = slot.split('-');
        const slotStart = parseInt(startStr.split(':')[0]);

        return bookings.find(b => {
            const bookingStart = parseInt(b.startTime.split(':')[0]);
            const bookingEnd = parseInt(b.endTime.split(':')[0]);
            return slotStart >= bookingStart && slotStart < bookingEnd;
        });
    }
}
