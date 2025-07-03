import React from 'react';
import { Activity, Rating } from '../types/survey';

interface ActivityItemProps {
  activity: Activity;
  rating: Rating;
  onRatingChange: (activityId: number, rating: Rating) => void;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity, rating, onRatingChange }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 activity-row fade-in">
      <div className="flex items-center justify-between">
        <div className="flex-1 pr-4">
          <h3 className="font-semibold text-lg text-gray-800">{activity.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onRatingChange(activity.id, rating === 'love' ? null : 'love')}
            className={`rating-button px-4 py-2 rounded-lg text-2xl transition-all ${
              rating === 'love' 
              ? 'bg-green-100 ring-2 ring-green-500' 
              : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title="Love it - Very valuable">
            👍
          </button>
          <button 
            onClick={() => onRatingChange(activity.id, rating === 'neutral' ? null : 'neutral')}
            className={`rating-button px-4 py-2 rounded-lg text-2xl transition-all ${
              rating === 'neutral' 
              ? 'bg-yellow-100 ring-2 ring-yellow-500' 
              : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title="Neutral - Somewhat valuable">
            😐
          </button>
          <button 
            onClick={() => onRatingChange(activity.id, rating === 'hate' ? null : 'hate')}
            className={`rating-button px-4 py-2 rounded-lg text-2xl transition-all ${
              rating === 'hate' 
              ? 'bg-red-100 ring-2 ring-red-500' 
              : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title="Not valuable">
            👎
          </button>
        </div>
      </div>
    </div>
  );
};