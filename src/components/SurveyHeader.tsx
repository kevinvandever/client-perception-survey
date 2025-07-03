import React from 'react';

export const SurveyHeader: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-3">Real Estate Services Survey</h1>
      <p className="text-lg text-gray-600 mb-4">Help us understand what you value most</p>
      <div className="bg-blue-50 rounded-lg p-4 max-w-2xl mx-auto mb-8">
        <p className="text-sm text-blue-800">
          <strong>Instructions:</strong> Rate each based on how valuable it is to your business. If you have additional thoughts, please add them in the comment box.
        </p>
        <div className="flex justify-center gap-6 mt-3">
          <span className="flex items-center gap-2">
            <span className="text-2xl">👍</span>
            <span className="font-medium">Love it - Very valuable to me</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-2xl">😐</span>
            <span className="font-medium">Neutral - Somewhat valuable</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-2xl">👎</span>
            <span className="font-medium">Not valuable to me</span>
          </span>
        </div>
      </div>
    </div>
  );
};