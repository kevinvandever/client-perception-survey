export interface Activity {
  id: number;
  pillar: number;
  pillarName: string;
  name: string;
  description: string;
}

export type Rating = 'love' | 'neutral' | 'hate' | null;

export interface SurveyResponse {
  id: string;
  activityId: number;
  rating: Rating;
  comment?: string;
  timestamp: Date;
  userId?: string;
}

export interface SurveyStats {
  love: number;
  neutral: number;
  hate: number;
  totalRated: number;
  progress: number;
}