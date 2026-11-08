/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SessionStatus } from '../../types';

interface BadgeProps {
  status?: SessionStatus | 'MERGED' | 'FREE' | 'VALID' | 'WARNING' | 'ERROR';
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, children, className = '', size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs md:text-sm font-medium';

  switch (status) {
    case 'SCHEDULED':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
          {children || 'Scheduled'}
        </span>
      );
    case 'CANCELLED':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
          {children || 'Cancelled'}
        </span>
      );
    case 'RESCHEDULED':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
          {children || 'Rescheduled'}
        </span>
      );
    case 'MERGED':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5" />
          {children || 'Merged Class'}
        </span>
      );
    case 'FREE':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800 ${sizeClasses} ${className}`}>
          {children || 'Free Period'}
        </span>
      );
    case 'VALID':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-emerald-100 text-emerald-800 ${sizeClasses} ${className}`}>
          ✓ {children || 'Valid'}
        </span>
      );
    case 'WARNING':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-amber-100 text-amber-800 ${sizeClasses} ${className}`}>
          ⚠ {children || 'Warning'}
        </span>
      );
    case 'ERROR':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-red-100 text-red-800 ${sizeClasses} ${className}`}>
          ✕ {children || 'Error'}
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses} ${className}`}>
          {children}
        </span>
      );
  }
};
