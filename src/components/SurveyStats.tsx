import React from 'react';
import { SurveyStats } from '../types/survey';

interface SurveyStatsProps {
  stats: SurveyStats;
}

export const SurveyStatsComponent: React.FC<SurveyStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 mt-8">
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="text-3xl font-bold text-blue-600">{stats.progress}%</div>
        <div className="text-sm text-gray-600">Completed</div>
        <div className="mt-2 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${stats.progress}%` }}
          />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="text-3xl font-bold text-green-600">{stats.love}</div>
        <div className="text-sm text-gray-600">Love it 👍</div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="text-3xl font-bold text-yellow-600">{stats.neutral}</div>
        <div className="text-sm text-gray-600">Neutral 😐</div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="text-3xl font-bold text-red-600">{stats.hate}</div>
        <div className="text-sm text-gray-600">Not valuable 👎</div>
      </div>
    </div>
  );
};