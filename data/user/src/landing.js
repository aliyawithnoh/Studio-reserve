/**
 * Landing Page Script
 * Loads and displays events
 */

async function loadEvents() {
    try {
        const response = await fetch('data/events.json');
        const data = await response.json();
        
        if (data.events) {
            renderEvents(data.events);
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

function renderEvents(events) {
    const upcomingContainer = document.getElementById('upcoming-events-grid');
    const pastContainer = document.getElementById('past-events-grid');
    
    if (!upcomingContainer || !pastContainer) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = events.filter(event => new Date(event.date) >= today);
    const past = events.filter(event => new Date(event.date) < today);

    //