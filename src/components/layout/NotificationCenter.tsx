/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bell, Check, Clock, AlertTriangle, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { useKNUSTStore } from '../../db/store';
import { NotificationItem, UserRole } from '../../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  currentGroupId?: string;
  currentLecturerId?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  currentRole,
  currentGroupId
}) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useKNUSTStore();
  const [filter, setFilter] = useState<'ALL' | 'CANCELLATION' | 'RESCHEDULE' | 'MERGED'>('ALL');

  if (!isOpen) return null;

  // Filter relevant notifications
  const filteredNotifications = notifications.filter(notif => {
    // If student, show if relevant to their group or general
    if (currentRole === 'STUDENT' && currentGroupId) {
      const isTargeted = notif.targetGroupIds.length === 0 || notif.targetGroupIds.includes(currentGroupId);
      if (!isTargeted) return false;
    }

    if (filter === 'ALL') return true;
    if (filter === 'CANCELLATION') return notif.type === 'CANCELLATION';
    if (filter === 'RESCHEDULE') return notif.type === 'RESCHEDULE';
    if (filter === 'MERGED') return notif.type === 'MERGED_CLASS';
    return true;
  });

  const unreadCount = filteredNotifications.filter(n => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Class Notifications</h2>
              <p className="text-xs text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsAsRead()}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center px-4 py-2 border-b border-slate-100 bg-white gap-1 text-xs">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              filter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('CANCELLATION')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              filter === 'CANCELLATION' ? 'bg-rose-100 text-rose-800 font-semibold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Cancellations
          </button>
          <button
            onClick={() => setFilter('RESCHEDULE')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              filter === 'RESCHEDULE' ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Rescheduled
          </button>
          <button
            onClick={() => setFilter('MERGED')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              filter === 'MERGED' ? 'bg-indigo-100 text-indigo-800 font-semibold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Merged
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bell className="w-10 h-10 mx-auto mb-2 stroke-1 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No notifications found</p>
              <p className="text-xs text-slate-400 mt-1">Lecture cancellations or reschedules will appear here instantly.</p>
            </div>
          ) : (
            filteredNotifications.map(item => (
              <NotificationCard
                key={item.id}
                item={item}
                onMarkRead={() => markNotificationAsRead(item.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const NotificationCard: React.FC<{ item: NotificationItem; onMarkRead: () => void }> = ({ item, onMarkRead }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'CANCELLATION':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'RESCHEDULE':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'MERGED_CLASS':
        return <Layers className="w-4 h-4 text-indigo-600" />;
      default:
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getBorderColor = () => {
    if (!item.isRead) {
      switch (item.type) {
        case 'CANCELLATION':
          return 'border-l-4 border-l-rose-500 border-rose-200 bg-rose-50/30';
        case 'RESCHEDULE':
          return 'border-l-4 border-l-amber-500 border-amber-200 bg-amber-50/30';
        case 'MERGED_CLASS':
          return 'border-l-4 border-l-indigo-500 border-indigo-200 bg-indigo-50/30';
        default:
          return 'border-l-4 border-l-emerald-500 border-emerald-200 bg-emerald-50/30';
      }
    }
    return 'border-slate-200 bg-white opacity-85';
  };

  return (
    <div
      onClick={onMarkRead}
      className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-xs ${getBorderColor()}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-white shadow-xs border border-slate-100">
            {getIcon()}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {item.type.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!item.isRead && (
            <span className="w-2 h-2 rounded-full bg-emerald-600" title="Unread" />
          )}
          <span className="text-[11px] text-slate-400">
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <h4 className="font-bold text-slate-900 text-sm mt-2">{item.title}</h4>
      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>

      {/* Details Box */}
      {item.details && (
        <div className="mt-2.5 p-2 rounded-lg bg-slate-100/80 text-xs space-y-1 border border-slate-200/70">
          {item.details.originalTime && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="text-slate-400 font-medium">Original:</span>
              <span className="line-through text-slate-500">{item.details.originalTime}</span>
              {item.details.originalRoom && <span className="text-slate-400">({item.details.originalRoom})</span>}
            </div>
          )}

          {item.details.newTime && (
            <div className="flex items-center gap-1.5 font-medium text-emerald-800">
              <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Moved to: {item.details.newTime}</span>
              {item.details.newRoom && <span className="font-bold">in {item.details.newRoom}</span>}
            </div>
          )}

          {item.details.reason && (
            <div className="text-slate-600 pt-1 border-t border-slate-200/50 mt-1">
              <span className="font-semibold text-slate-700">Reason: </span>
              {item.details.reason}
            </div>
          )}
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
        <span>By: {item.authorName}</span>
        {item.courseCodes.length > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700 font-mono text-[10px]">
            {item.courseCodes.join(', ')}
          </span>
        )}
      </div>
    </div>
  );
};
