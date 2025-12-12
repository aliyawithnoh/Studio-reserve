/**
 * Data Service
 * Loads and manages all application data
 */

export class DataService {
    constructor() {
        this.rooms = [];
        this.bookings = [];
        this.events = [];
        this.forecast = null;
    }

    async loadAllData() {
        try {
            await Promise.all([
                this.loadRooms(),
                this.loadBookings(),
                this.loadEvents(),
                this.loadForecast()
            ]);
            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            return false;
        }
    }

    async loadRooms() {
        try {
            const response = await fetch('data/rooms.json');
            const data = await response.json();
            this.rooms = data.rooms;
        } catch (e) {
            console.error('Failed to load rooms.json', e);
            // Fallback rooms
            this.rooms = [
                { id: 'auditorium', name: 'Auditorium', capacity: 1000 },
                { id: 'library', name: 'Library', capacity: 100 },
                { id: 'grounds', name: 'Grounds', capacity: 1800 }
            ];
        }
    }

    async loadBookings() {
        // 1. Load static bookings from file (legacy/backup)
        let fileBookings = [];
        try {
            const response = await fetch('data/bookings.json');
            const data = await response.json();
            fileBookings = data.bookings || [];
        } catch (e) {
            console.warn('Could not load bookings.json, using empty list');
        }
        
        // 2. Load ONLY accepted/approved bookings from Shared LocalStorage
        // Pending requests are purposefully ignored here so they don't show on the calendar
        const acceptedRequests = this.getAcceptedRequestsFromStorage();
        
        // 3. Merge
        const allBookings = [...fileBookings];
        
        // Add accepted requests if they aren't already in the file data
        acceptedRequests.forEach(booking => {
            if (!allBookings.find(b => b.id === booking.id)) {
                allBookings.push(booking);
            }
        });
        
        this.bookings = allBookings;
        console.log(`📅 Loaded ${this.bookings.length} active bookings (pending requests hidden)`);
    }
    
    /**
     * Get only ACCEPTED/APPROVED bookings from localStorage 'requests'
     */
    getAcceptedRequestsFromStorage() {
        try {
            const requests = JSON.parse(localStorage.getItem('requests') || '[]');
            
            // STRICT FILTER: Only show bookings that Admin has accepted
            const approved = requests.filter(req => 
                req.status === 'accepted' || req.status === 'approved'
            );

            // Map to booking format expected by the calendar
            return approved.map(req => ({
                id: req.id,
                roomId: req.roomId || this.getRoomIdFromName(req.roomName || req.room),
                date: req.date,
                startTime: req.startTime,
                endTime: req.endTime,
                purpose: req.purpose,
                attendees: req.attendees,
                name: req.name,
                email: req.email,
                contact: req.contact || req.phone,
                status: 'accepted' // Normalize status for the booking object
            }));
        } catch (error) {
            console.error('Error loading accepted bookings from localStorage:', error);
            return [];
        }
    }
    
    /**
     * Convert room name to room ID
     */
    getRoomIdFromName(roomName) {
        const nameMap = {
            'Auditorium': 'auditorium',
            'Library': 'library',
            'Grounds': 'grounds'
        };
        return nameMap[roomName] || roomName?.toLowerCase() || 'auditorium';
    }

    async loadEvents() {
        try {
            const response = await fetch('data/events.json');
            const data = await response.json();
            this.events = data.events || [];
        } catch (e) {
            this.events = [];
        }
    }

    async loadForecast() {
        try {
            const response = await fetch('data/forecast.json');
            const data = await response.json();
            this.forecast = data.forecast;
        } catch (e) {
            this.forecast = null;
        }
    }

    getRooms() {
        return this.rooms;
    }

    getBookings() {
        return this.bookings;
    }

    getEvents() {
        return this.events;
    }

    getForecast() {
        return this.forecast;
    }

    getBookingsForRoom(roomId) {
        return this.bookings.filter(b => b.roomId === roomId);
    }

    getBookingsForDate(roomId, dateStr) {
        return this.bookings.filter(
            b => b.roomId === roomId && b.date === dateStr
        );
    }

    async saveBooking(booking) {
        // We return true to indicate "validation passed".
        // The actual saving happens in requestService (to 'requests' list)
        return true;
    }
}

// Export singleton instance
export const dataService = new DataService();