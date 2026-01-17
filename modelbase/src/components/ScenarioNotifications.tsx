import React, { useState, useEffect } from 'react';
import { ScenarioState } from '../scenario/types';

export type NotificationType = 'critical' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  duration?: number; // Auto-dismiss after this many ms
}

interface ScenarioNotificationsProps {
  state: ScenarioState | null;
  previousState: ScenarioState | null;
  onDismiss?: (notificationId: string) => void;
}

export function ScenarioNotifications({
  state,
  previousState,
  onDismiss
}: ScenarioNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!state || !previousState || state.status !== 'in_progress') return;

    const newNotifications: Notification[] = [];

    // Check for exit blocked/unblocked
    const previousExits = new Set(previousState.availableExits || []);
    const currentExits = new Set(state.availableExits || []);
    
    previousExits.forEach(exitId => {
      if (!currentExits.has(exitId)) {
        newNotifications.push({
          id: `exit-blocked-${exitId}-${Date.now()}`,
          type: 'critical',
          message: `Exit ${exitId} is no longer accessible.`,
          timestamp: Date.now(),
          duration: 5000
        });
      }
    });

    // Check for new blocked nodes (fire spread)
    const previousBlocked = new Set(previousState.blockedNodes || []);
    const currentBlocked = new Set(state.blockedNodes || []);
    
    currentBlocked.forEach(nodeId => {
      if (!previousBlocked.has(nodeId)) {
        const playerNode = state.playerNodeId;
        if (playerNode && nodeId !== playerNode) {
          newNotifications.push({
            id: `fire-spread-${nodeId}-${Date.now()}`,
            type: 'warning',
            message: 'Fire has spread to nearby areas.',
            timestamp: Date.now(),
            duration: 4000
          });
        }
      }
    });

    // Check for smoke level increases
    if (state.smokeAreas && previousState.smokeAreas) {
      state.smokeAreas.forEach((smokeArea, index) => {
        const prevSmoke = previousState.smokeAreas?.[index];
        if (prevSmoke && smokeArea.level > prevSmoke.level + 0.1) {
          const region = smokeArea.region || 'this area';
          newNotifications.push({
            id: `smoke-increase-${index}-${Date.now()}`,
            type: 'warning',
            message: `Smoke density increasing in ${region}.`,
            timestamp: Date.now(),
            duration: 4000
          });
        }
      });
    }

    // Check for path collapse
    const previousBlockedPaths = new Set(previousState.blockedPaths || []);
    const currentBlockedPaths = new Set(state.blockedPaths || []);
    
    currentBlockedPaths.forEach(pathKey => {
      if (!previousBlockedPaths.has(pathKey)) {
        newNotifications.push({
          id: `path-collapse-${pathKey}-${Date.now()}`,
          type: 'critical',
          message: 'A path has collapsed. Route may be blocked.',
          timestamp: Date.now(),
          duration: 5000
        });
      }
    });

    // Add new notifications
    if (newNotifications.length > 0) {
      setNotifications(prev => [...prev, ...newNotifications]);
    }
  }, [state, previousState]);

  // Auto-dismiss notifications
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    notifications.forEach(notification => {
      if (notification.duration && !dismissedIds.has(notification.id)) {
        const timer = setTimeout(() => {
          handleDismiss(notification.id);
        }, notification.duration);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, dismissedIds]);

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
    if (onDismiss) {
      onDismiss(id);
    }
  };

  const activeNotifications = notifications.filter(n => !dismissedIds.has(n.id));

  if (activeNotifications.length === 0) return null;

  const getNotificationStyle = (type: NotificationType) => {
    switch (type) {
      case 'critical':
        return {
          backgroundColor: '#2a1a1a',
          borderColor: '#ff4444',
          color: '#ffaaaa',
          icon: '🚨'
        };
      case 'warning':
        return {
          backgroundColor: '#2a2a1a',
          borderColor: '#ffaa44',
          color: '#ffccaa',
          icon: '⚠️'
        };
      case 'info':
        return {
          backgroundColor: '#1a1a2a',
          borderColor: '#4488ff',
          color: '#aaaaff',
          icon: 'ℹ️'
        };
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '350px'
    }}>
      {activeNotifications.map(notification => {
        const style = getNotificationStyle(notification.type);
        return (
          <div
            key={notification.id}
            style={{
              backgroundColor: style.backgroundColor,
              border: `2px solid ${style.borderColor}`,
              borderRadius: '8px',
              padding: '12px 15px',
              color: style.color,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              animation: 'slideIn 0.3s ease-out',
              cursor: 'pointer'
            }}
            onClick={() => handleDismiss(notification.id)}
          >
            <span style={{ fontSize: '18px' }}>{style.icon}</span>
            <span style={{ flex: 1 }}>{notification.message}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss(notification.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: style.color,
                fontSize: '18px',
                cursor: 'pointer',
                padding: '0 5px'
              }}
            >
              ×
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
