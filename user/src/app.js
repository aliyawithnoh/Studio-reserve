
/**
 * BCHS Booking System - Main Application
 */

import { state, setSelectedRoom } from './core/state.js';
import { loadData } from './services/bookingService.js';
import { RoomList } from './components/RoomListComponent.js';
import { Calendar } from './components/CalendarComponent.js';
import { TimeSlots } from './components/TimeSlotsComponent.js';
import { Chat } from './components/ChatComponent.js';
import { BookingModal } from './components/BookingModalComponent.js';
import { Forecast } from './components/ForecastComponent.js';

class BookingApp {
    constructor() {
        this.roomList = new RoomList();
        this.calendar = new Calendar();
        this.timeSlots = new TimeSlots();
        this.chat = new Chat();
        this.bookingModal = new BookingModal();
        this.forecast = new Forecast();
    }

    async init() {
        console.log('🚀 Initializing BCHS Booking System...');

        try {
            const dataLoaded = await loadData();
            if (!dataLoaded) {
                console.error('❌ Failed to load data');
                alert('System initialized with offline data or failed to load. Some features may be limited.');
            }

            if (state.rooms.length > 0) {
                setSelectedRoom(state.rooms[0]);
            } else {
                console.warn('⚠️ No rooms found in data.');
            }

            this.roomList.render();
            this.calendar.render();
            this.timeSlots.render();
            this.chat.init();
            this.bookingModal.init();
            this.forecast.render();
            this.initEventListeners();
            this.setupAutoRefresh();

            console.log('✅ BCHS Booking System initialized successfully');
        } catch (error) {
            console.error('❌ Critical error during app initialization:', error);
        }
    }

    initEventListeners() {
        // Calendar navigation
        const prevBtn = document.getElementById('prev-month');
        const nextBtn = document.getElementById('next-month');

        if (prevBtn) prevBtn.addEventListener('click', () => {
            this.calendar.previousMonth();
        });
        
        if (nextBtn) nextBtn.addEventListener('click', () => {
            this.calendar.nextMonth();
        });

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleTabClick(btn));
        });
    }

    handleTabClick(btn) {
        const tab = btn.dataset.tab;

        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const tabContent = document.getElementById(`${tab}-tab`);
        if (tabContent) tabContent.classList.add('active');
    }

    /**
     * Setup auto-refresh when page regains focus
     * This updates the calendar when returning from admin panel
     */
    setupAutoRefresh() {
        // Reload bookings when page becomes visible again
        document.addEventListener('visibilitychange', async () => {
            if (!document.hidden) {
                console.log('🔄 Page visible - refreshing bookings...');
                await loadData();
                this.calendar.render();
                this.timeSlots.render();
            }
        });
        
        // Also refresh when window regains focus
        window.addEventListener('focus', async () => {
            console.log('🔄 Window focused - refreshing bookings...');
            await loadData();
            this.calendar.render();
            this.timeSlots.render();
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new BookingApp();
    app.init();
});
