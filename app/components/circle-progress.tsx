import React from "react";

interface CircleProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
}

const CircleProgress: React.FC<CircleProgressProps> = ({
  progress,
  size = 44,
  strokeWidth = 2,
  color = "#00AB66",
  bgColor = "white",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform rotate-[-90deg]">
      {/* 背景圈 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={bgColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* 进度圈 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy="0"
        fontSize="12"
        fill="#fff"
        transform="rotate(90, 20, 20)"
      >
        {Math.round(progress)}%
      </text>
    </svg>
  );
};

export default CircleProgress;
