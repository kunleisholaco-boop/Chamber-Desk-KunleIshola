import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', color = 'orange' }) => {
    // Color variants for different roles
    const colorClasses = {
        orange: {
            ring: 'border-orange-200 border-t-orange-600',
            pulse: 'bg-orange-400'
        },
        purple: {
            ring: 'border-purple-200 border-t-purple-600',
            pulse: 'bg-purple-400'
        }
    };

    const colors = colorClasses[color] || colorClasses.orange;

    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
                {/* Outer spinning ring */}
                <div className={`w-16 h-16 border-4 ${colors.ring} rounded-full animate-spin`}></div>
                {/* Inner pulsing circle */}
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 ${colors.pulse} rounded-full animate-pulse`}></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">{message}</p>
        </div>
    );
};

export default LoadingSpinner;
