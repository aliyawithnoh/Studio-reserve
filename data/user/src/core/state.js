/**
 * Application State Management
 */

export const state = {
    rooms: [],
    selectedRoom: null,
    selectedDate: new Date(),
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    bookings: [],
    chatMessages: [],
    isChatLoading: false
};

export function setSelectedRoom(room) {
    state.selectedRoom = room;
}

export function setSelectedDate(date) {
    state.selectedDate = date;
}

export function setMonth(month, year) {
    state.currentMonth = month;
    state.currentYear = year;
}

export function addBooking(booking) {
    state.bookings.push(booking);
}

export function addChatMessage(message) {
    state.chatMessages.push(message);
}

export function setChatLoading(isLoading) {
    state.isChatLoading = isLoading;
}
