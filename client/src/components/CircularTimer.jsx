export default function CircularTimer({ timeLeft, total }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / total) * circumference;
  
  // No warning color change as per minimalist spec
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full timer-ring">
        <circle
          className="ring-bg fill-transparent"
          strokeWidth="2"
          r={radius}
          cx="24"
          cy="24"
        />
        <circle
          className="ring-progress fill-transparent"
          strokeWidth="2"
          strokeLinecap="square"
          r={radius}
          cx="24"
          cy="24"
          style={{ strokeDasharray: circumference, strokeDashoffset }}
        />
      </svg>
      <span className="font-mono text-sm font-bold text-foreground absolute">
        {timeLeft}
      </span>
    </div>
  );
}
