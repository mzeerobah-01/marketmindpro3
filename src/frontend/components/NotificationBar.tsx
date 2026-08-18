import React from 'react';
import { AppNotification } from '../types';
import { Zap, AlertTriangle, ShieldCheck, X, Activity } from 'lucide-react';

interface NotificationBarProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
  isDarkMode?: boolean;
}

export const NotificationBar: React.FC<NotificationBarProps> = ({
  notifications,
  onDismiss,
  isDarkMode = true,
}) => {
  const activeAlerts = notifications.filter(n => !n.dismissed).slice(0, 2);

  if (activeAlerts.length === 0) return null;

  return (
    <div id="notification-alert-bar" className="w-full bg-[#1E2329] border-b border-[#2B2F36] py-1 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs">
        {activeAlerts.map(alert => {
          const isSignal = alert.type === 'signal';
          const isRisk = alert.type === 'risk' || alert.type === 'warning';

          return (
            <div
              key={alert.id}
              className={`flex-1 flex items-center justify-between px-2.5 py-1 rounded text-xs border ${
                isSignal
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                  : isRisk
                  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                  : 'bg-green-500/10 border-green-500/30 text-green-300'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                {isSignal ? (
                  <Zap className="w-3.5 h-3.5 text-yellow-500 shrink-0 animate-pulse" />
                ) : isRisk ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-green-400 shrink-0" />
                )}
                <span className="font-bold uppercase text-[10px] tracking-wider text-white">
                  {alert.title}:
                </span>
                <span className="truncate text-[11px] text-[#EAECEF]">{alert.message}</span>
              </div>
              <button
                onClick={() => onDismiss(alert.id)}
                className="ml-2 text-[#848E9C] hover:text-white p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
