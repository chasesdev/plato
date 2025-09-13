import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export interface DebugLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  category: string;
  message: string;
}

interface DebugLoggerProps {
  visible?: boolean;
}

class DebugLogManager {
  private static instance: DebugLogManager;
  private logs: DebugLog[] = [];
  private listeners: Set<(logs: DebugLog[]) => void> = new Set();
  private maxLogs = 50;

  static getInstance(): DebugLogManager {
    if (!DebugLogManager.instance) {
      DebugLogManager.instance = new DebugLogManager();
    }
    return DebugLogManager.instance;
  }

  addLog(level: DebugLog['level'], category: string, message: string) {
    const log: DebugLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level,
      category,
      message
    };

    this.logs.unshift(log);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    this.listeners.forEach(listener => listener([...this.logs]));
  }

  subscribe(listener: (logs: DebugLog[]) => void) {
    this.listeners.add(listener);
    listener([...this.logs]);

    return () => {
      this.listeners.delete(listener);
    };
  }

  clear() {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
  }

  getLogs() {
    return [...this.logs];
  }
}

export const debugLog = DebugLogManager.getInstance();

const DebugLogger: React.FC<DebugLoggerProps> = ({ visible = true }) => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = debugLog.subscribe(setLogs);
    return unsubscribe;
  }, []);

  const getLevelColor = (level: DebugLog['level']) => {
    switch (level) {
      case 'success': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getLevelEmoji = (level: DebugLog['level']) => {
    switch (level) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '🔴';
      default: return 'ℹ️';
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.headerText}>
          Debug Logs ({logs.length}) {isExpanded ? '▼' : '▶'}
        </Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => debugLog.clear()}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {isExpanded && (
        <ScrollView style={styles.logContainer} nestedScrollEnabled>
          {logs.length === 0 ? (
            <Text style={styles.noLogsText}>No debug logs yet</Text>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <Text style={styles.logHeader}>
                  {getLevelEmoji(log.level)} {log.timestamp} [{log.category}]
                </Text>
                <Text style={[styles.logMessage, { color: getLevelColor(log.level) }]}>
                  {log.message}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    width: 300,
    maxHeight: 400,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#374151',
    borderRadius: 4,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 12,
  },
  logContainer: {
    maxHeight: 300,
    padding: 8,
  },
  noLogsText: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    padding: 16,
  },
  logItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  logHeader: {
    color: '#d1d5db',
    fontSize: 11,
    fontFamily: 'Menlo',
  },
  logMessage: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Menlo',
  },
});

export default DebugLogger;