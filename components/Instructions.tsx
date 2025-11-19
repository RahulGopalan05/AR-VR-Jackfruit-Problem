
import React from 'react';
import { MouseIcon, HandIcon } from './Icons';

const Instructions: React.FC = () => {
  return (
    <div className="absolute bottom-4 left-4 p-4 bg-gray-900/60 backdrop-blur-md rounded-lg text-gray-300 max-w-xs z-10 border border-gray-700">
      <h3 className="font-bold text-lg text-white mb-3">Controls</h3>
      <ul className="space-y-3">
        <li className="flex items-center space-x-3">
          <MouseIcon className="w-8 h-8 text-cyan-400 flex-shrink-0" />
          <div>
            <p><span className="font-semibold text-white">Enter Cut Mode:</span></p>
            <p>Then <span className="font-semibold text-white">Left Click + Drag</span> on the rug to cut.</p>
          </div>
        </li>
        <li className="flex items-center space-x-3">
          <HandIcon className="w-8 h-8 text-cyan-400 flex-shrink-0" />
          <div>
            <p><span className="font-semibold text-white">Left Click + Drag:</span> Rotate camera.</p>
            <p><span className="font-semibold text-white">Right Click + Drag:</span> Pan camera.</p>
             <p><span className="font-semibold text-white">Scroll:</span> Zoom in/out.</p>
          </div>
        </li>
      </ul>
    </div>
  );
};

export default Instructions;
