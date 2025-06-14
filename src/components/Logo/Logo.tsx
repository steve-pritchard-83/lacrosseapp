import React from 'react';
import styles from './Logo.module.css';

const Logo: React.FC = () => (
  <div className={styles.logoContainer}>
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Lacrosse App Logo"
    >
      <defs>
        <linearGradient id="stickGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FF4500', stopOpacity: 1 }} />
        </linearGradient>
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="2" dy="2" result="offsetblur" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#dropShadow)">
        {/* Stick 1 */}
        <line
          x1="20"
          y1="80"
          x2="80"
          y2="20"
          stroke="url(#stickGradient)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="80" cy="20" r="12" fill="none" stroke="#FFFFFF" strokeWidth="3" />
        <path
          d="M 70 15 C 75 10, 85 10, 90 15 L 85 25 C 80 20, 75 20, 70 25 Z"
          fill="#FFFFFF"
          opacity="0.8"
        />

        {/* Stick 2 */}
        <line
          x1="20"
          y1="20"
          x2="80"
          y2="80"
          stroke="url(#stickGradient)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="20" cy="20" r="12" fill="none" stroke="#FFFFFF" strokeWidth="3" />
        <path
          d="M 10 15 C 15 10, 25 10, 30 15 L 25 25 C 20 20, 15 20, 10 25 Z"
          fill="#FFFFFF"
          opacity="0.8"
        />
      </g>
      {/* Lacrosse Ball */}
      <circle cx="50" cy="50" r="8" fill="#FFFFFF" />
      <circle cx="50" cy="50" r="10" fill="none" stroke="#FFA500" strokeWidth="2" />
    </svg>
  </div>
);

export default Logo; 