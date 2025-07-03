import { supabase } from '../lib/supabase';
import { Rating, SurveyResponse } from '../types/survey';

const USER_ID_KEY = 'survey_user_id';

export class SupabaseSurveyService {
  private static sessionId: string | null = null;

  private static getUserId(): string {
    let userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(USER_ID_KEY, userId);
    }
    return userId;
  }

  private static async getOrCreateSession(): Promise<string> {
    if (this.sessionId) return this.sessionId;
    
    if (!supabase) {
      console.log('Supabase not configured, using local session');
      this.sessionId = 'local-session';
      return 'local-session';
    }

    const userId = this.getUserId();
    
    try {
      // First, try to find existing session for this user
      const { data: existingSession, error: findError } = await supabase
        .from('survey_sessions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (findError) throw findError;

      if (existingSession) {
        // Found existing session, reuse it
        console.log('Reusing existing session for user:', userId);
        this.sessionId = existingSession.id;
        return existingSession.id;
      }

      // No existing session, create new one
      console.log('Creating new session for user:', userId);
      const { data: newSession, error: createError } = await supabase
        .from('survey_sessions')
        .insert({
          user_id: userId,
          user_agent: navigator.userAgent
        })
        .select()
        .single();

      if (createError) throw createError;

      this.sessionId = newSession.id;
      return newSession.id;
    } catch (error) {
      console.error('Error managing session:', error);
      // Fallback to local session
      this.sessionId = 'local-session';
      return 'local-session';
    }
  }

  static async saveRating(activityId: number, rating: Rating): Promise<void> {
    const userId = this.getUserId();
    console.log('Saving rating:', { activityId, rating, userId });

    try {
      if (!supabase) {
        console.log('Supabase not configured, using localStorage only');
        this.saveToLocalStorage(activityId, rating);
        return;
      }

      if (rating === null) {
        // Delete the rating
        console.log('Deleting rating for activity:', activityId);
        const { error } = await supabase
          .from('survey_responses')
          .delete()
          .eq('activity_id', activityId)
          .eq('user_id', userId);

        if (error) {
          console.error('Delete error:', error);
          throw error;
        }
      } else {
        // Get or create session (reuse existing if available)
        await this.getOrCreateSession();

        // Upsert the rating (insert or update)
        console.log('Upserting rating:', { activityId, rating, userId, sessionId: this.sessionId });
        const { data, error } = await supabase
          .from('survey_responses')
          .upsert({
            activity_id: activityId,
            rating,
            user_id: userId,
            session_id: this.sessionId
          }, {
            onConflict: 'activity_id,user_id'
          })
          .select();

        if (error) {
          console.error('Upsert error:', error);
          throw error;
        }
        console.log('Upsert successful:', data);
      }

      // Also save to localStorage as backup
      this.saveToLocalStorage(activityId, rating);
    } catch (error) {
      console.error('Error saving to Supabase, falling back to localStorage:', error);
      this.saveToLocalStorage(activityId, rating);
    }
  }

  static async getRating(activityId: number): Promise<Rating> {
    const userId = this.getUserId();

    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('rating')
        .eq('activity_id', activityId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data ? (data.rating as Rating) : null;
    } catch (error) {
      console.error('Error fetching from Supabase, falling back to localStorage:', error);
      return this.getRatingFromLocalStorage(activityId);
    }
  }

  static async getAllUserResponses(): Promise<SurveyResponse[]> {
    const userId = this.getUserId();

    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((row: any) => ({
        id: row.id,
        activityId: row.activity_id,
        rating: row.rating as Rating,
        timestamp: new Date(row.created_at),
        userId: row.user_id
      }));
    } catch (error) {
      console.error('Error fetching responses from Supabase:', error);
      return [];
    }
  }

  static async clearUserResponses(): Promise<void> {
    const userId = this.getUserId();

    try {
      const { error } = await supabase
        .from('survey_responses')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      // Also clear localStorage
      this.clearLocalStorage();
    } catch (error) {
      console.error('Error clearing responses from Supabase:', error);
      this.clearLocalStorage();
    }
  }

  static async markSessionComplete(): Promise<void> {
    if (!this.sessionId) return;

    try {
      const { error } = await supabase
        .from('survey_sessions')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', this.sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking session complete:', error);
    }
  }

  static async exportToCSV(activities: any[]): Promise<string> {
    const responses = await this.getAllUserResponses();
    let csv = 'Service Category,Service Name,Client Rating,Timestamp\n';
    
    activities.forEach(activity => {
      const response = responses.find(r => r.activityId === activity.id);
      const rating = response ? response.rating : 'Not Rated';
      const timestamp = response ? new Date(response.timestamp).toLocaleString() : '';
      csv += `"${activity.pillarName}","${activity.name}","${rating}","${timestamp}"\n`;
    });

    return csv;
  }

  static async downloadCSV(activities: any[]): Promise<void> {
    const csv = await this.exportToCSV(activities);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-perception-survey-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Fallback methods for localStorage
  private static saveToLocalStorage(activityId: number, rating: Rating): void {
    if (rating === null) {
      localStorage.removeItem(`rating_${activityId}`);
    } else {
      localStorage.setItem(`rating_${activityId}`, rating);
    }
  }

  private static getRatingFromLocalStorage(activityId: number): Rating {
    const rating = localStorage.getItem(`rating_${activityId}`);
    return rating as Rating || null;
  }

  private static clearLocalStorage(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('rating_')) {
        localStorage.removeItem(key);
      }
    });
  }

  // Load all ratings for initial state (hybrid approach)
  static async loadAllRatings(activities: any[]): Promise<Record<number, Rating>> {
    const ratings: Record<number, Rating> = {};

    try {
      const userId = this.getUserId();
      const { data, error } = await supabase
        .from('survey_responses')
        .select('activity_id, rating')
        .eq('user_id', userId);

      if (error) throw error;

      // Initialize all ratings as null
      activities.forEach(activity => {
        ratings[activity.id] = null;
      });

      // Fill in actual ratings from database
      data.forEach((row: any) => {
        ratings[row.activity_id] = row.rating as Rating;
      });
    } catch (error) {
      console.error('Error loading ratings from Supabase, falling back to localStorage:', error);
      
      // Fallback to localStorage
      activities.forEach(activity => {
        ratings[activity.id] = this.getRatingFromLocalStorage(activity.id);
      });
    }

    return ratings;
  }

  // Session management utilities
  static async hasExistingSession(userId?: string): Promise<boolean> {
    if (!supabase) return false;
    
    const targetUserId = userId || this.getUserId();
    
    try {
      const { data, error } = await supabase
        .from('survey_sessions')
        .select('id')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking existing session:', error);
      return false;
    }
  }

  static async getSessionInfo(userId?: string) {
    if (!supabase) return null;
    
    const targetUserId = userId || this.getUserId();
    
    try {
      const { data, error } = await supabase
        .from('survey_sessions')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching session info:', error);
      return null;
    }
  }

  // Analytics methods
  static async getAnalytics() {
    try {
      const { data, error } = await supabase
        .from('survey_analytics')
        .select('*')
        .order('activity_id');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return [];
    }
  }
}