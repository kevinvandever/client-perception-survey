import React from 'react';
import { Activity } from '../types/survey';

interface SurveySummaryProps {
  lovedActivities: Activity[];
  onExport: () => void;
  onReset: () => void;
}

export const SurveySummary: React.FC<SurveySummaryProps> = ({ lovedActivities, onExport, onReset }) => {
  if (lovedActivities.length === 0) return null;

  return (
    <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6">Your Top Valued Services</h2>
      <div className="space-y-2 mb-6">
        {lovedActivities.slice(0, 10).map(activity => (
          <div key={activity.id} className="bg-green-50 p-3 rounded">
            • {activity.name}
          </div>
        ))}
      </div>
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold mb-2">Thank you for your feedback!</h3>
        <p className="text-gray-700 mb-4">Your responses help us focus on the services that matter most to you.</p>
        <div className="flex gap-3">
          <button
            onClick={onExport}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Export Results
          </button>
          <button
            onClick={onReset}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Reset Survey
          </button>
        </div>
      </div>
    </div>
  );
};