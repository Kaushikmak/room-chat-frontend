import React from 'react';

export default function LoadingWave() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
      
      {/* TEXT */}
      <h2 className="text-4xl font-heading mb-8 animate-pulse tracking-widest">
        AUTHENTICATING
      </h2>

      {/* WAVE ANIMATION CONTAINER */}
      <div className="flex items-end gap-2 h-24">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-8 bg-main border-2 border-black shadow-neo-sm"
            style={{
              animation: `wave 1s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes wave {
          0%, 100% { height: 20%; background-color: #FD9745; }
          50% { height: 100%; background-color: #FFB347; }
        }
      `}</style>
    </div>
  );
}