import React, { useState } from 'react';

const UravinLoading = ({ size = 'md', text, fullScreen = false, className = '' }) => {
  const [videoError, setVideoError] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-36 h-36',
    xl: 'w-48 h-48',
  };

  const loaderElement = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${sizeClasses[size] || sizeClasses.md} flex items-center justify-center`}>
        {!videoError ? (
          <video
            src="/assets/uravin-logo-loading.mp4"
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoError(true)}
            className="w-full h-full object-contain pointer-events-none rounded-2xl"
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Rotating golden halo */}
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#B68A3D] border-r-[#D4AF37] border-b-[#7A2E1E] animate-spin" />
            <div className="w-[72%] h-[72%] rounded-full bg-[#F7F3EB] border border-[#DDD1BF] shadow-md p-2 flex items-center justify-center animate-pulse">
              <img
                src="/assets/uravin-logo.png"
                alt="Loading..."
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
      {text && (
        <p className="mt-3 text-sm font-bold text-[#7A2E1E] animate-pulse font-sans">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAF6F0]/90 backdrop-blur-sm">
        {loaderElement}
      </div>
    );
  }

  return loaderElement;
};

export { UravinLoading as UravuuLoading };
export default UravinLoading;
