import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  noise?: boolean;
}

export function Card({ children, className, hover = false, glass = false, noise = false }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={
        hover
          ? {
              y: -8,
              scale: 1.01,
              rotateX: 3,
              rotateY: -3,
              transition: { type: 'spring', stiffness: 280, damping: 22 },
            }
          : undefined
      }
      style={hover ? { transformPerspective: 1000, transformStyle: 'preserve-3d' } : undefined}
      className={cn(
        'relative overflow-hidden rounded-2xl transition-transform duration-300 will-change-transform',
        glass
          ? 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-white/60 dark:border-white/10'
          : 'bg-surface-light/95 dark:bg-surface-dark/95 border border-white/65 dark:border-white/10',
        noise && 'dark:noise-overlay',
        hover && 'shadow-card hover:shadow-card-hover hover:shadow-glow-primary cursor-pointer',
        !hover && 'shadow-card',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-60 dark:from-white/10" />
      {children}
    </motion.div>
  );
}

interface GlassCardProps extends CardProps {
  glowColor?: 'primary' | 'success' | 'warning' | 'danger';
}

export function GlassCard({ children, className, glowColor, ...props }: GlassCardProps) {
  return (
    <Card
      glass
      className={cn(
        glowColor && `shadow-glow-${glowColor}`,
        'light-mode-glass-card',
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}

