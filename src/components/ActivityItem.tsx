import React, { useState, useEffect } from 'react';
import { Activity, Rating } from '../types/survey';

interface ActivityItemProps {
  activity: Activity;
  rating: Rating;
  comment?: string;
  onRatingChange: (activityId: number, rating: Rating) => void;
  onCommentChange?: (activityId: number, comment: string) => void;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ 
  activity, 
  rating, 
  comment = '',
  onRatingChange,
  onCommentChange 
}) => {
  const [localComment, setLocalComment] = useState(comment);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setLocalComment(comment);
  }, [comment]);

  const handleCommentBlur = () => {
    if (onCommentChange && localComment !== comment) {
      onCommentChange(activity.id, localComment);
    }
  };

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
      
      {/* Comment section */}
      {rating && (
        <div className="mt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>{isExpanded ? '▼' : '▶'}</span>
            <span>{localComment ? 'Edit comment' : 'Add comment'}</span>
          </button>
          
          {isExpanded && (
            <div className="mt-2">
              <textarea
                value={localComment}
                onChange={(e) => setLocalComment(e.target.value)}
                onBlur={handleCommentBlur}
                placeholder="Share your thoughts about this activity..."
                className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};