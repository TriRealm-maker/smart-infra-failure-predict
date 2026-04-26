import { motion } from 'framer-motion';

interface CinematicLoaderProps {
  title?: string;
  subtitle?: string;
}

export function CinematicLoader({
  title = 'Initializing CrisisGuard',
  subtitle = 'Synchronizing telemetry and mission controls',
}: CinematicLoaderProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070a16] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 premium-grid opacity-35" />
        <div className="absolute -top-20 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-500/30 blur-[140px]" />
        <div className="absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-[140px]" />
        <div className="absolute -right-12 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-[150px]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl rounded-3xl border border-white/15 bg-white/5 p-8 shadow-[0_30px_70px_-35px_rgba(76,29,149,0.8)] backdrop-blur-2xl"
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/75">CrisisGuard AI</p>
              <h2 className="mt-2 text-2xl font-extrabold">{title}</h2>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              className="relative h-12 w-12"
            >
              <div className="absolute inset-0 rounded-full border border-cyan-300/50" />
              <div className="absolute inset-1 rounded-full border border-indigo-300/60" />
              <div className="absolute inset-[7px] rounded-full bg-white/25" />
            </motion.div>
          </div>

          <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              className="absolute inset-y-0 w-1/2 rounded-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
            />
          </div>

          <div className="mt-5 flex items-center justify-between text-sm text-white/70">
            <span>{subtitle}</span>
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            >
              LIVE
            </motion.span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
