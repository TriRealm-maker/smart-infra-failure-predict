import { ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { SplineScene } from './ui/splite';

interface AuthSceneProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthScene({ title, subtitle, children, footer }: AuthSceneProps) {
  const [enable3D, setEnable3D] = useState(false);

  useEffect(() => {
    const setFromViewport = () => setEnable3D(window.innerWidth >= 1024);
    setFromViewport();
    window.addEventListener('resize', setFromViewport);
    return () => window.removeEventListener('resize', setFromViewport);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080c1a] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 premium-grid opacity-40" />
        <div className="absolute -top-20 left-[55%] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-indigo-500/30 blur-[140px]" />
        <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-[150px]" />
        <div className="absolute -right-10 top-1/4 h-[26rem] w-[26rem] rounded-full bg-purple-500/20 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
        {enable3D ? (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden lg:block"
          >
            <div className="rounded-3xl border border-white/15 bg-white/[0.04] p-8 backdrop-blur-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1.5 text-xs uppercase tracking-[0.24em] text-cyan-100">
                <SparklesIcon className="h-4 w-4" />
                Proactive resilience
              </div>
              <h1 className="max-w-xl text-4xl font-extrabold leading-tight">
                Mission control for modern infrastructure response.
              </h1>
              <p className="mt-4 max-w-lg text-white/75">
                Real-time telemetry, failure analytics, and emergency orchestration in one premium operations cockpit.
              </p>
              <div className="mt-8 h-[22rem] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                <SplineScene
                  scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                  className="h-full w-full"
                />
              </div>
            </div>
          </motion.section>
        ) : null}

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto w-full max-w-lg"
        >
          <div className="mb-7 text-center lg:text-left">
            <div className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 p-3 shadow-[0_16px_32px_-14px_rgba(220,38,38,0.9)]">
              <ShieldCheckIcon className="h-9 w-9 text-white" />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight">CrisisGuard AI</h2>
            <p className="mt-2 text-white/70">{subtitle}</p>
          </div>

          <div className="surface-premium gradient-border p-7 md:p-8">
            <h3 className="mb-5 text-2xl font-bold text-slate-900 dark:text-white">{title}</h3>
            {children}
          </div>

          {footer ? <div className="mt-5 text-center text-sm text-white/65">{footer}</div> : null}
        </motion.section>
      </div>
    </div>
  );
}
