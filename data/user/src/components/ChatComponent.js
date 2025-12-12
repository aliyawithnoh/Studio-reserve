/**
 * Chat Component
 * AI assistant chatbox
 */

import { state, addChatMessage, setChatLoading } from '../core/state.js';

export class Chat {
    constructor() {
        this.container = document.getElementById('chat-messages');
        this.input = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('chat-send');
    }

    init() {
        this.addMessage('assistant', "Hi! I'm your booking assistant. I can help you with questions about room reservations and policies. How can I assist you today?");
        this.render();
        this.attachEventListeners();
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = '';

        state.chatMessages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.sender}`;

            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.textContent = msg.text;

            messageDiv.appendChild(bubble);
            this.container.appendChild(messageDiv);
        });

        if (state.isChatLoading) {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message assistant';
            typingDiv.innerHTML = `
                <div class="typing-indicator">
                    <div class="spinner"></div>
                    <span>AI is typing...</span>
                </div>
            `;
            this.container.appendChild(typingDiv);
        }

        this.container.scrollTop = this.container.scrollHeight;
    }

    addMessage(sender, text) {
        addChatMessage({ sender, text });
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        this.addMessage('user', message);
        this.input.value = '';
        setChatLoading(true);
        this.render();

        try {
            const response = await fetch('https://api.blackbox.ai/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: message }],
                    previewToken: null,
                    userId: null,
                    codeModelMode: true,
                    agentMode: {},
                    trendingAgentMode: {},
                    isMicMode: false,
                    userSystemPrompt: 'You are a helpful assistant for a school booking system.',
                    maxTokens: 1024,
                    webSearchMode: false,
                    promptUrls: '',
                    isChromeExt: false,
                    githubToken: null
                })
            });

            const data = await response.text();
            this.addMessage('assistant', data || 'I can help you with booking questions!');
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessage('assistant', this.generateSmartResponse(message));
        }

        setChatLoading(false);
        this.render();
    }

    generateSmartResponse(userMessage) {
        const message = userMessage.toLowerCase();

        if (message.includes('book') || message.includes('reserve') || message.includes('reservation')) {
            return "To make a booking, select a date on the calendar and click the '+Request' button. You'll need to provide your name, contact info, number of attendees, and the purpose of your booking.";
        }

        if (message.includes('room') || message.includes('auditorium') || message.includes('library') || message.includes('grounds')) {
            return `We have three rooms available:\n• Auditorium (capacity: 1,000)\n• Library (capacity: 100)\n• Grounds (capacity: 1,800)\n\nClick on any room in the left sidebar to see its calendar and availability.`;
        }

        if (message.includes('time') || message.includes('hour') || message.includes('when')) {
            return "Booking hours are from 7:00 AM to 6:00 PM. You can see available time slots for your selected date on the right side of the screen.";
        }

        if (message.includes('weekend') || message.includes('saturday') || message.includes('sunday')) {
            return "The Grounds room is closed on weekends (Saturdays and Sundays). The Auditorium and Library are available 7 days a week.";
        }

        if (message.includes('capacity') || message.includes('how many') || message.includes('people')) {
            return "Room capacities:\n• Auditorium: 1,000 people\n• Library: 100 people\n• Grounds: 1,800 people";
        }

        return "I'm here to help! You can ask me about:\n• How to book a room\n• Available rooms and their capacities\n• Booking hours\n• Weekend availability\n• Time slots";
    }

    attachEventListeners() {
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (this.input) {
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }
    }
}
