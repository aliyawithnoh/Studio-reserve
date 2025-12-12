/**
 * Room List Component
 * Displays available rooms
 */

import { state, setSelectedRoom } from '../core/state.js';
import { Calendar } from './CalendarComponent.js';
import { TimeSlots } from './TimeSlotsComponent.js';

export class RoomList {
    constructor() {
        this.container = document.getElementById('room-list');
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = '';

        state.rooms.forEach(room => {
            const roomCard = document.createElement('button');
            roomCard.className = 'room-card';

            if (state.selectedRoom && state.selectedRoom.id === room.id) {
                roomCard.classList.add('selected');
            }

            roomCard.innerHTML = `
                <div class="room-card-content">
                    <div class="room-name">${room.name}</div>
                    <div class="room-capacity">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        ${room.capacity}
                    </div>
                </div>
            `;

            roomCard.addEventListener('click', () => this.selectRoom(room));
            this.container.appendChild(roomCard);
        });
    }

    selectRoom(room) {
        setSelectedRoom(room);
        this.render();

        const calendar = new Calendar();
        calendar.render();

        const timeSlots = new TimeSlots();
        timeSlots.render();
    }
}
