import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

export function getAQIColor(aqi: string): string {
  const lowerAqi = aqi.toLowerCase();
  if (lowerAqi.includes('good')) return 'text-success';
  if (lowerAqi.includes('fair')) return 'text-warning';
  if (lowerAqi.includes('moderate')) return 'text-orange-500';
  if (lowerAqi.includes('poor') || lowerAqi.includes('very poor')) return 'text-danger';
  return 'text-purple-500';
}

export function getAQIBgColor(aqi: string): string {
  const lowerAqi = aqi.toLowerCase();
  if (lowerAqi.includes('good')) return 'bg-success/10';
  if (lowerAqi.includes('fair')) return 'bg-warning/10';
  if (lowerAqi.includes('moderate')) return 'bg-orange-500/10';
  if (lowerAqi.includes('poor') || lowerAqi.includes('very poor')) return 'bg-danger/10';
  return 'bg-purple-500/10';
}
