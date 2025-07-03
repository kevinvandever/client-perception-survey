import { Rating, SurveyResponse } from '../types/survey';

const STORAGE_KEY = 'survey_responses';
const USER_ID_KEY = 'survey_user_id';

export class SurveyService {
  private static getUserId(): string {
    let userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(USER_ID_KEY, userId);
    }
    return userId;
  }

  static saveRating(activityId: number, rating: Rating): void {
    const responses = this.getAllResponses();
    const userId = this.getUserId();
    
    // Remove existing rating for this activity if any
    const filtered = responses.filter(r => r.activityId !== activityId || r.userId !== userId);
    
    if (rating !== null) {
      filtered.push({
        id: `${userId}_${activityId}_${Date.now()}`,
        activityId,
        rating,
        timestamp: new Date(),
        userId
      });
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  static getRating(activityId: number): Rating {
    const responses = this.getAllResponses();
    const userId = this.getUserId();
    const response = responses.find(r => r.activityId === activityId && r.userId === userId);
    return response ? response.rating : null;
  }

  static getAllResponses(): SurveyResponse[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  static getUserResponses(): SurveyResponse[] {
    const userId = this.getUserId();
    return this.getAllResponses().filter(r => r.userId === userId);
  }

  static clearUserResponses(): void {
    const responses = this.getAllResponses();
    const userId = this.getUserId();
    const filtered = responses.filter(r => r.userId !== userId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  static exportToCSV(activities: any[]): string {
    const responses = this.getUserResponses();
    let csv = 'Service Category,Service Name,Client Rating,Timestamp\n';
    
    activities.forEach(activity => {
      const response = responses.find(r => r.activityId === activity.id);
      const rating = response ? response.rating : 'Not Rated';
      const timestamp = response ? new Date(response.timestamp).toLocaleString() : '';
      csv += `"${activity.pillarName}","${activity.name}","${rating}","${timestamp}"\n`;
    });

    return csv;
  }

  static downloadCSV(activities: any[]): void {
    const csv = this.exportToCSV(activities);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-perception-survey-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}