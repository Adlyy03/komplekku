import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CloudSlash } from 'phosphor-react-native';
import { Typography } from '@/constants/theme';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check connectivity periodically or on network state change
    const checkConnectivity = async () => {
      try {
        const res = await fetch('https://www.google.com/generate_204', {
          method: 'HEAD',
          cache: 'no-cache',
        });
        setIsOffline(!res.ok && res.status !== 204);
      } catch {
        setIsOffline(true);
      }
    };

    const interval = setInterval(() => {
      void checkConnectivity();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <CloudSlash size={16} color="#FFFFFF" weight="bold" />
      <Text style={styles.text}>
        Mode Offline: Menampilkan data tersimpan di perangkat.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#B45309',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  text: {
    ...Typography.bodyS,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 11,
  },
});
