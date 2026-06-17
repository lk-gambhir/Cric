import { VALID_RUNS } from '../utils/constants';

export default function NumberSelector({ onSelect, disabled, selectedRun }) {
  return (
    <div className="grid grid-cols-3 gap-4 w-full max-w-lg mx-auto">
      {VALID_RUNS.map((run) => (
        <button
          key={run}
          onClick={() => onSelect(run)}
          disabled={disabled || selectedRun !== null}
          className={`
            aspect-square flex items-center justify-center 
            text-4xl sm:text-5xl font-black display-title border 
            transition-all duration-150 ease-[cubic-bezier(0.25,0,0,1)]
            ${selectedRun === run 
              ? 'bg-accent text-accent-foreground border-accent' 
              : 'bg-transparent text-foreground border-border hover:border-foreground'}
            ${(disabled || selectedRun !== null) && selectedRun !== run ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {run}
        </button>
      ))}
    </div>
  );
}
