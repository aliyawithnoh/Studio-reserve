
/**
 * Booking Service
 * Handles all booking-related operations
 */

import { state } from '../core/state.js';
import { dataService } from './dataService.js';
import { requestService } from './requestService.js';
import { getLocalISODate } from '../utils/dateUtils.js';

export async function loadData() {
    try {
        const success = await dataService.loadAllData();
        
        if (success) {
            state.rooms = dataService.getRooms();
            state.bookings = dataService.getBookings();
        }
        
        return success;
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load data. Please ensure data files exist.');
        return false;
    }
}

export async function saveBookingRequest(request) {
    // Save to data service (adds to bookings)
    const success = await dataService.saveBooking(request);
    
    if (success) {
        // Also save to request service (captures in requests.json)
        const room = state.rooms.find(r => r.id === request.roomId);
        await requestService.saveRequest({
            ...request,
            roomName: room?.name || 'Unknown Room'
        });
        
        console.log('📝 Booking request saved! View all requests:', requestService.getAllRequests());
    }
    
    return success;
}

export function getBookingsForDate(roomId, dateStr) {
    return state.bookings.filter(
        b => b.roomId === roomId && b.date === dateStr
    );
}

export function getBookingDensity(roomId, day, month, year) {
    // Use getLocalISODate to ensure we match the "YYYY-MM-DD" format used in data
    // regardless of the timezone (avoiding UTC shift from toISOString)
    const dateStr = getLocalISODate(new Date(year, month, day));
    const dayBookings = getBookingsForDate(roomId, dateStr);
    
    if (dayBookings.length === 0) return 'none';
    
    let totalBookedHours = 0;
    dayBookings.forEach(booking => {
        const start = parseInt(booking.startTime.split(':')[0], 10);
        const end = parseInt(booking.endTime.split(':')[0], 10);
        totalBookedHours += (end - start);
    });
    
    const totalAvailableHours = 11; // 7 AM - 6 PM
    const bookedPercentage = (totalBookedHours / totalAvailableHours) * 100;
    
    if (bookedPercentage >= 70) return 'full';
    if (bookedPercentage >= 40) return 'busy';
    return 'light';
}

export function isTimeSlotBooked(roomId, dateStr, slotTime) {
    const [startStr, endStr] = slotTime.split('-');
    const slotStart = parseInt(startStr.split(':')[0], 10);
    const slotEnd = parseInt(endStr.split(':')[0], 10);
    
    const bookings = getBookingsForDate(roomId, dateStr);
    
    return bookings.some(booking => {
        const bookingStart = parseInt(booking.startTime.split(':')[0], 10);
        const bookingEnd = parseInt(booking.endTime.split(':')[0], 10);
        // Check if the requested slot overlaps with any existing booking
        // (Start of slot is before end of booking) AND (End of slot is after start of booking)
        return (slotStart < bookingEnd && slotEnd > bookingStart);
    });
}

export function getAvailableSlots(roomId, dateStr) {
    const allSlots = [
        '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00',
        '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00',
        '15:00-16:00', '16:00-17:00', '17:00-18:00'
    ];
    
    return allSlots.filter(
        slot => !isTimeSlotBooked(roomId, dateStr, slot)
    );
}

export function getBookedSlots(roomId, dateStr) {
    const allSlots = [
        '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00',
        '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00',
        '15:00-16:00', '16:00-17:00', '17:00-18:00'
    ];
    
    return allSlots.filter(
        slot => isTimeSlotBooked(roomId, dateStr, slot)
    );
}

export function findConflict(roomId, date, startTime, endTime) {
    return state.bookings.find(booking =>
        booking.roomId === roomId &&
        booking.date === date &&
        booking.startTime < endTime &&
        booking.endTime > startTime
    );
}
