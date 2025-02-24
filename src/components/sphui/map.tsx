import React from 'react';

interface MapProps {
  children?: React.ReactNode;
}

function Map({ children }: MapProps) {
  return (
    <div className="flex-1 bg-zinc-950 relative overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-[repeat(100,1fr)] grid-rows-[repeat(100,1fr)] gap-[1px] opacity-10">
        {Array.from({ length: 10000 }).map((_, i) => (
          <div key={i} className="bg-zinc-800 w-full h-full" />
        ))}
      </div>
      {children}
    </div>
  );
}

export default Map;
