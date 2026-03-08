'use client';

interface NutritionScoreProps {
  score: number;
  size?: number;
  label?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#84cc16';
  if (score >= 40) return '#f59e0b';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Needs Work';
  return 'Poor';
}

export default function NutritionScore({ score, size = 160, label }: NutritionScoreProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const dashoffset = circumference - (progress / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="#f0e6d6"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          transform="rotate(-90 50 50)"
          className="score-gauge"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        {/* Score number */}
        <text
          x="50" y="46"
          textAnchor="middle"
          fontSize="24"
          fontWeight="bold"
          fill={color}
        >
          {Math.round(score)}
        </text>
        {/* Label */}
        <text
          x="50" y="62"
          textAnchor="middle"
          fontSize="10"
          fill="#78716c"
        >
          {label || getScoreLabel(score)}
        </text>
      </svg>
    </div>
  );
}
