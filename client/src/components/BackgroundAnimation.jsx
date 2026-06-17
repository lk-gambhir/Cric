import { motion } from 'framer-motion';

export default function BackgroundAnimation({ screen }) {
  const isPreGame = !screen || screen === 'landing' || screen === 'lobby' || screen === 'waiting';

  if (isPreGame) {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Central Wicket SVG Illustration (Diagonal) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05]">
          <svg width="400" height="400" viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(-15deg) translateY(-20px)' }}>
            <rect x="30" y="40" width="8" height="100" rx="4" fill="white" />
            <rect x="46" y="40" width="8" height="100" rx="4" fill="white" />
            <rect x="62" y="40" width="8" height="100" rx="4" fill="white" />
            
            <rect x="33" y="36" width="12" height="4" rx="2" fill="white" />
            <rect x="55" y="36" width="12" height="4" rx="2" fill="white" />
          </svg>
        </div>
      </div>
    );
  }

  // Matrix Background for actual gameplay (toss, playing, etc.)
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <motion.div
        className="absolute inset-0 opacity-[0.03]"
        animate={{
          backgroundPosition: ['0px 0px', '100px 100px'],
        }}
        transition={{
          repeat: Infinity,
          repeatType: 'loop',
          duration: 10,
          ease: 'linear',
        }}
        style={{
          backgroundImage: `
            linear-gradient(45deg, #22c55e 25%, transparent 25%, transparent 75%, #22c55e 75%, #22c55e),
            linear-gradient(45deg, #22c55e 25%, transparent 25%, transparent 75%, #22c55e 75%, #22c55e)
          `,
          backgroundSize: '100px 100px',
          backgroundPosition: '0 0, 50px 50px',
        }}
      />
    </div>
  );
}
