/**
 * Calendar Component
 * Handles calendar display and date selection
 */

import { state, setSelectedDate } from '../core/state.js';
import { getMonthYear, getDaysInMonth, getFirstDayOfMonth, isToday, isSameDate, formatDate, isPastDate } from '../utils/dateUtils.js';
import { getBookingDensity } from '../services/bookingService.js';
import { TimeSlots } from './TimeSlotsComponent.js';

export class Calendar {
    constructor() {
        this.container = document.getElementById('calendar-grid');
        this.monthYearEl = document.getElementById('calendar-month-year');
        this.roomTitleEl = document.getElementById('calendar-room-title');
    }

    render() {
        if (!this.container || !state.selectedRoom) return;

        this.roomTitleEl.textContent = `Calendar - ${state.selectedRoom.name}`;
        this.monthYearEl.textContent = getMonthYear(state.currentMonth, state.currentYear);

        const daysInMonth = getDaysInMonth(state.currentMonth, state.currentYear);
        const firstDay = getFirstDayOfMonth(state.currentMonth, state.currentYear);

        let html = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
            .map(day => `<div class="day-header">${day}</div>`)
            .join('');

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            html += '<div></div>';
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Render day cells
        for (let day = 1; day <= daysInMonth; day++) {
            html += this.renderDayCell(day, today);
        }

        this.container.innerHTML = html;
        this.updateGroundsNote();
        this.updateRequestButton();
        this.attachEventListeners();
    }

    renderDayCell(day, today) {
        const isCurrentDay = isToday(day, state.currentMonth, state.currentYear);
        const selected = isSameDate(state.selectedDate, new Date(state.currentYear, state.currentMonth, day));
        const density = getBookingDensity(state.selectedRoom.id, day, state.currentMonth, state.currentYear);

        const date = new Date(state.currentYear, state.currentMonth, day);
        date.setHours(0, 0, 0, 0);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isPast = date < today;

        const isClosed = (state.selectedRoom.id === 'grounds' && isWeekend) || isPast;

        let bgColor = 'transparent';
        if (isClosed) {
            bgColor = isPast && !isWeekend ? '#e5e7eb' : '#4b5563';
        } else if (selected) {
            bgColor = 'var(--calendar-selected-bg)';
        } else if (isCurrentDay) {
            bgColor = 'var(--calendar-today-bg)';
        } else if (density === 'full') {
            bgColor = 'var(--calendar-full-bg)';
        } else if (density === 'busy') {
            bgColor = 'var(--calendar-busy-bg)';
        } else if (density === 'light') {
            bgColor = 'var(--calendar-light-bg)';
        }

        const closedStyle = isClosed 
            ? `background-color: ${bgColor}; opacity: ${isPast && !isWeekend ? '0.4' : '0.6'}; color: #9ca3af; cursor: not-allowed;` 
            : `background-color: ${bgColor};`;

        const todayRing = isCurrentDay && !selected && !isClosed 
            ? 'box-shadow: 0 0 0 2px var(--calendar-today-ring);' 
            : '';

        return `
            <button 
                class="day-cell" 
                data-day="${day}" 
                ${isClosed ? `disabled style="${closedStyle}"` : `style="${closedStyle} ${todayRing}"`}
            >
                <span>${day}</span>
                ${isClosed ? `<span style="font-size: 8px; position: absolute; bottom: 2px;">${isPast && !isWeekend ? 'Past' : 'Closed'}</span>` : ''}
            </button>
        `;
    }

    updateGroundsNote() {
        const groundsNote = document.getElementById('grounds-note');
        if (groundsNote) {
            groundsNote.style.display = state.selectedRoom.id === 'grounds' ? 'block' : 'none';
        }
    }

    updateRequestButton() {
        const requestBtn = document.getElementById('request-btn');
        if (!requestBtn) return;

        const isPast = isPastDate(state.selectedDate);
        requestBtn.disabled = isPast;
        requestBtn.style.backgroundColor = isPast ? '#9ca3af' : 'var(--button-primary)';
        requestBtn.style.cursor = isPast ? 'not-allowed' : 'pointer';
        requestBtn.style.opacity = isPast ? '0.6' : '1';
        requestBtn.title = isPast ? 'Cannot request bookings for past dates' : '';
    }

    attachEventListeners() {
        document.querySelectorAll('.day-cell').forEach(cell => {
            if (!cell.disabled) {
                cell.addEventListener('click', () => {
                    const day = parseInt(cell.dataset.day);
                    setSelectedDate(new Date(state.currentYear, state.currentMonth, day));
                    this.render();
                    
                    const timeSlots = new TimeSlots();
                    timeSlots.render();

                    const dateText = document.getElementById('selected-date-text');
                    if (dateText) {
                        dateText.textContent = formatDate(state.selectedDate);
                    }
                });
            }
        });
    }

    previousMonth() {
        state.currentMonth--;
        if (state.currentMonth < 0) {
            state.currentMonth = 11;
            state.currentYear--;
        }
        this.render();
    }

    nextMonth() {
        state.currentMonth++;
        if (state.currentMonth > 11) {
            state.currentMonth = 0;
            state.currentYear++;
        }
        this.render();
    }
}
