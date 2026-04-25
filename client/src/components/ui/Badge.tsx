import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  pulse?: boolean;
  className?: string;
}

export function Badge({ children, variant = 'default', pulse = false, className }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 dark:bg-white/10 text-text-primary-light dark:text-text-primary-dark',
    primary: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
        variants[variant],
        className
      )}
    >
      {pulse && variant === 'danger' && (
        <motion.span
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -inset-1 rounded-full bg-danger/30"
        />
      )}
      {children}
    </motion.span>
  );
}

interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high';
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const config = {
    low: { variant: 'success' as const, label: 'Low' },
    medium: { variant: 'warning' as const, label: 'Medium' },
    high: { variant: 'danger' as const, label: 'High' },
  };

  const { variant, label } = config[level];

  return (
    <Badge variant={variant} pulse={level === 'high'}>
      <span className="relative flex h-2 w-2 mr-2">
        {level === 'high' && (
          <motion.span
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inline-flex h-full w-full rounded-full bg-danger"
          />
        )}
        <span className={cn(
          'relative inline-flex rounded-full h-2 w-2',
          level === 'low' && 'bg-success',
          level === 'medium' && 'bg-warning',
          level === 'high' && 'bg-danger'
        )} />
      </span>
      {label}
    </Badge>
  );
}
