/**
 * Forecast Component
 * AI-powered analytics and predictions
 */

import { dataService } from '../services/dataService.js';

export class Forecast {
    constructor() {
        this.container = document.getElementById('forecast-container');
    }

    render() {
        if (!this.container) return;

        const forecast = dataService.getForecast();
        if (!forecast) {
            this.container.innerHTML = '<p>Loading forecast data...</p>';
            return;
        }

        const { summary, roomAnalytics, weeklyTrends, recommendations } = forecast;

        this.container.innerHTML = `
            <div class="forecast-section">
                <h3 class="forecast-title">📊 Booking Overview</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Total Bookings</div>
                        <div class="stat-value">${summary.totalBookings}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Most Popular</div>
                        <div class="stat-value">${summary.mostPopularRoom}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Peak Hours</div>
                        <div class="stat-value">${summary.peakHours}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Utilization Rate</div>
                        <div class="stat-value">${summary.utilizationRate}</div>
                    </div>
                </div>
            </div>

            <div class="forecast-section">
                <h3 class="forecast-title">🏢 Room Analytics</h3>
                <div class="room-analytics">
                    ${roomAnalytics.map(room => this.renderRoomAnalytics(room)).join('')}
                </div>
            </div>

            <div class="forecast-section">
                <h3 class="forecast-title">📈 Weekly Trends</h3>
                <div class="trends-container">
                    ${weeklyTrends.map(trend => this.renderWeeklyTrend(trend)).join('')}
                </div>
            </div>

            <div class="forecast-section">
                <h3 class="forecast-title">💡 AI Recommendations</h3>
                <div class="recommendations">
                    ${recommendations.map(rec => this.renderRecommendation(rec)).join('')}
                </div>
            </div>

            <div class="forecast-footer">
                <small>Last updated: ${new Date(forecast.lastUpdated).toLocaleString()}</small>
            </div>
        `;
    }

    renderRoomAnalytics(room) {
        const trendIcon = room.trend === 'increasing' ? '📈' : room.trend === 'decreasing' ? '📉' : '➡️';
        const trendColor = room.trend === 'increasing' ? '#10b981' : room.trend === 'decreasing' ? '#ef4444' : '#6b7280';

        return `
            <div class="room-analytics-card">
                <div class="room-analytics-header">
                    <h4>${room.roomName}</h4>
                    <span class="trend-badge" style="background-color: ${trendColor}20; color: ${trendColor}">
                        ${trendIcon} ${room.trend}
                    </span>
                </div>
                <div class="room-analytics-body">
                    <div class="analytics-row">
                        <span>Total Bookings:</span>
                        <strong>${room.totalBookings}</strong>
                    </div>
                    <div class="analytics-row">
                        <span>Utilization Rate:</span>
                        <strong>${room.utilizationRate}</strong>
                    </div>
                    <div class="analytics-row">
                        <span>Avg Attendees:</span>
                        <strong>${room.averageAttendees}</strong>
                    </div>
                    <div class="analytics-row">
                        <span>Peak Days:</span>
                        <strong>${Array.isArray(room.peakDays) ? room.peakDays.join(', ') : room.peakDays}</strong>
                    </div>
                    <div class="analytics-row prediction">
                        <span>Next Week Prediction:</span>
                        <strong>${room.predictedNextWeek} bookings</strong>
                    </div>
                </div>
            </div>
        `;
    }

    renderWeeklyTrend(trend) {
        const isCurrentWeek = trend.week.includes('Current');
        const isPrediction = trend.week.includes('Predicted');

        return `
            <div class="trend-card ${isPrediction ? 'prediction' : ''}">
                <div class="trend-header">
                    <h4>${trend.week}</h4>
                    ${isPrediction ? '<span class="prediction-badge">🔮 Predicted</span>' : ''}
                </div>
                <div class="trend-stats">
                    <div class="trend-stat">
                        <span class="trend-stat-label">Total:</span>
                        <span class="trend-stat-value">${trend.totalBookings}</span>
                    </div>
                    <div class="trend-breakdown">
                        <div class="trend-item">
                            <span>Auditorium:</span>
                            <strong>${trend.auditorium}</strong>
                        </div>
                        <div class="trend-item">
                            <span>Library:</span>
                            <strong>${trend.library}</strong>
                        </div>
                        <div class="trend-item">
                            <span>Grounds:</span>
                            <strong>${trend.grounds}</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderRecommendation(rec) {
        const priorityColors = {
            high: '#ef4444',
            medium: '#f59e0b',
            low: '#10b981'
        };

        const priorityIcons = {
            high: '🔴',
            medium: '🟡',
            low: '🟢'
        };

        return `
            <div class="recommendation-card" style="border-left-color: ${priorityColors[rec.priority]}">
                <div class="recommendation-header">
                    <span class="recommendation-icon">${priorityIcons[rec.priority]}</span>
                    <span class="recommendation-priority" style="color: ${priorityColors[rec.priority]}">
                        ${rec.priority.toUpperCase()} PRIORITY
                    </span>
                </div>
                <p class="recommendation-message">${rec.message}</p>
            </div>
        `;
    }
}
