import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  CaretLeft,
  Warning,
  PhoneCall,
  ShieldCheck,
  Ambulance,
  Fire,
} from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/lib/supabase-provider';
import { useComplex } from '@/lib/complex-provider';
import {
  triggerEmergency,
  getActiveEmergencies,
  updateEmergencyStatus,
  type EmergencyWithDetails,
} from '@/services/security';
import type { EmergencyType } from '@/types/database';

export default function SOSScreen() {
  const { user } = useAuth();
  const { household, isRw, isRt, isDeveloper } = useComplex();
  const isManager = isDeveloper || isRw || isRt;

  const [activeList, setActiveList] = useState<EmergencyWithDetails[]>([]);
  const [selectedType, setSelectedType] = useState<EmergencyType>('general');
  const [isPressing, setIsPressing] = useState(false);
  const [triggering, setTriggering] = useState(false);

  const [holdProgress] = useState(() => new Animated.Value(0));

  const loadEmergencies = useCallback(async () => {
    try {
      const { data } = await getActiveEmergencies();
      setActiveList(data);
    } catch {
      // Clean fallback
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    getActiveEmergencies().then(({ data }) => {
      if (mounted) {
        setActiveList(data);
      }
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handlePressIn = () => {
    setIsPressing(true);
    Animated.timing(holdProgress, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        void fireEmergency();
      }
    });
  };

  const handlePressOut = () => {
    setIsPressing(false);
    Animated.timing(holdProgress, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).stop();
    holdProgress.setValue(0);
  };

  const fireEmergency = async () => {
    if (!user?.id) return;
    setTriggering(true);
    try {
      const { error } = await triggerEmergency({
        userId: user.id,
        houseId: household?.house?.id || null,
        rtId: household?.rt?.id || null,
        rwId: household?.rw?.id || null,
        emergencyType: selectedType,
        notes: `Sinyal Darurat dari ${household?.house?.block ? 'Blok ' + household.house.block : ''} No. ${household?.house?.house_number || '-'}`,
      });

      if (error) {
        Alert.alert('Gagal Mengirim SOS', error.message);
      } else {
        Alert.alert(
          'SINYAL DARURAT DIAKTIFKAN!',
          'Peringatan darurat telah disiarkan ke pos keamanan dan seluruh pengurus komplek.',
          [{ text: 'OK' }]
        );
        await loadEmergencies();
      }
    } finally {
      setTriggering(false);
      holdProgress.setValue(0);
    }
  };

  const handleUpdateStatus = async (
    emergencyId: string,
    status: 'acknowledged' | 'resolved' | 'cancelled'
  ) => {
    if (!user?.id) return;
    try {
      const { error } = await updateEmergencyStatus({
        emergencyId,
        status,
        actorId: user.id,
      });

      if (error) {
        Alert.alert('Gagal', error.message);
      } else {
        Alert.alert('Sukses', `Status darurat diperbarui menjadi ${status}.`);
        await loadEmergencies();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const callNumber = (phone: string) => {
    void Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(main)' as any))}
          hitSlop={8}
          style={styles.backButton}
        >
          <CaretLeft size={20} color={Colors.stone[700]} />
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bantuan & Keadaan Darurat</Text>
        <Text style={styles.subtitle}>
          Pusat panggilan darurat dan tombol panik untuk keamanan komplek.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Active Emergency Alert if any */}
        {activeList.length > 0 && (
          <View style={styles.activeAlertContainer}>
            <Warning size={24} color="#DC2626" weight="fill" />
            <View style={{ flex: 1 }}>
              <Text style={styles.activeAlertTitle}>
                {activeList.length} PANGGILAN DARURAT AKTIF
              </Text>
              {activeList.map((e) => (
                <View key={e.id} style={styles.alertItem}>
                  <Text style={styles.alertItemText}>
                    Rumah Blok {e.house?.block || '-'} No. {e.house?.house_number || '-'} • Tipe:{' '}
                    {e.emergency_type.toUpperCase()}
                  </Text>
                  <Text style={styles.alertItemSub}>{e.created_at.split('T')[1].slice(0, 5)} WIB</Text>

                  {(isManager || e.user_id === user?.id) && (
                    <View style={styles.alertActionRow}>
                      {isManager && e.status === 'active' && (
                        <TouchableOpacity
                          style={styles.ackBtn}
                          onPress={() => handleUpdateStatus(e.id, 'acknowledged')}
                        >
                          <Text style={styles.ackBtnText}>Tangani</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.resolveBtn}
                        onPress={() =>
                          handleUpdateStatus(e.id, e.user_id === user?.id ? 'cancelled' : 'resolved')
                        }
                      >
                        <Text style={styles.resolveBtnText}>
                          {e.user_id === user?.id ? 'Batalkan SOS' : 'Selesai'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* SOS Panic Button Trigger Card */}
        <View style={styles.panicCard}>
          <Text style={styles.panicTitle}>TOMBOL PANIK (SOS)</Text>
          <Text style={styles.panicDesc}>
            Tekan dan tahan tombol selama 2 detik untuk menyiarkan alarm darurat ke Pos Keamanan & Pengurus RT/RW.
          </Text>

          {/* Type Selector */}
          <View style={styles.typeRow}>
            {[
              { id: 'general', label: 'Umum', icon: Warning },
              { id: 'security', label: 'Keamanan', icon: ShieldCheck },
              { id: 'medical', label: 'Medis', icon: Ambulance },
              { id: 'fire', label: 'Kebakaran', icon: Fire },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.typeBtn,
                    selectedType === item.id && styles.typeBtnActive,
                  ]}
                  onPress={() => setSelectedType(item.id as EmergencyType)}
                >
                  <Icon
                    size={18}
                    color={selectedType === item.id ? '#DC2626' : Colors.stone[500]}
                    weight="bold"
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      selectedType === item.id && styles.typeBtnTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Press and Hold Big Button */}
          <View style={styles.sosButtonWrapper}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={[styles.sosButton, isPressing && styles.sosButtonPressed]}
              disabled={triggering}
            >
              {triggering ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.sosText}>SOS</Text>
                  <Text style={styles.sosSubText}>
                    {isPressing ? 'TAHAN TERUS...' : 'TAHAN 2 DETIK'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: holdProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>

        {/* Emergency Contacts List */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>KONTAK DARURAT RESMI</Text>

          {[
            { name: 'Pos Satpam Komplek', phone: '081234567890', sub: 'Keamanan Lingkungan 24 Jam' },
            { name: 'Layanan Ambulans (SPGDT)', phone: '118', sub: 'Darurat Medis Nasional' },
            { name: 'Kepolisian Sektor (Polsek)', phone: '110', sub: 'Pelayanan Polisi' },
            { name: 'Pemadam Kebakaran', phone: '113', sub: 'Dinas Penanggulangan Kebakaran' },
          ].map((c, i) => (
            <TouchableOpacity
              key={i}
              style={styles.contactItem}
              onPress={() => callNumber(c.phone)}
            >
              <View style={styles.contactIconBox}>
                <PhoneCall size={20} color="#16A34A" weight="bold" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>{c.name}</Text>
                <Text style={styles.contactSub}>{c.sub}</Text>
              </View>
              <Text style={styles.contactPhone}>{c.phone}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.stone[25],
  },
  header: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[3],
    backgroundColor: Colors.stone[0],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing[2],
    alignSelf: 'flex-start',
  },
  backButtonText: {
    ...Typography.label,
    color: Colors.stone[600],
    fontSize: 13,
  },
  title: {
    ...Typography.h2,
    color: Colors.stone[900],
    fontSize: 20,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.bodyS,
    color: Colors.stone[500],
  },
  content: {
    padding: Spacing[4],
    gap: Spacing[4],
  },
  activeAlertContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: Radius.lg,
    padding: Spacing[4],
  },
  activeAlertTitle: {
    ...Typography.bodyM,
    fontWeight: '800',
    color: '#991B1B',
  },
  alertItem: {
    marginTop: Spacing[2],
    backgroundColor: '#FFFFFF',
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  alertItemText: {
    ...Typography.bodyS,
    fontWeight: '700',
    color: Colors.stone[900],
  },
  alertItemSub: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontSize: 11,
    marginTop: 2,
  },
  alertActionRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  ackBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    borderRadius: Radius.xs,
  },
  ackBtnText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontSize: 11,
  },
  resolveBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    borderRadius: Radius.xs,
  },
  resolveBtnText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontSize: 11,
  },
  panicCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.lg,
    padding: Spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  panicTitle: {
    ...Typography.overline,
    color: '#DC2626',
    fontWeight: '800',
    letterSpacing: 1,
  },
  panicDesc: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    textAlign: 'center',
    marginVertical: Spacing[2],
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginBottom: Spacing[4],
    width: '100%',
  },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    backgroundColor: Colors.stone[50],
  },
  typeBtnActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  typeBtnText: {
    ...Typography.bodyS,
    color: Colors.stone[600],
    fontSize: 11,
  },
  typeBtnTextActive: {
    color: '#DC2626',
    fontWeight: '700',
  },
  sosButtonWrapper: {
    alignItems: 'center',
    marginVertical: Spacing[3],
    width: '100%',
  },
  sosButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FCA5A5',
  },
  sosButtonPressed: {
    backgroundColor: '#B91C1C',
    transform: [{ scale: 0.95 }],
  },
  sosText: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 36,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  sosSubText: {
    ...Typography.overline,
    color: '#FEE2E2',
    fontSize: 9,
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#DC2626',
    borderRadius: Radius.full,
    marginTop: Spacing[3],
  },
  card: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    gap: Spacing[3],
  },
  cardHeading: {
    ...Typography.overline,
    color: Colors.stone[500],
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
  },
  contactIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactName: {
    ...Typography.bodyM,
    fontWeight: '600',
    color: Colors.stone[900],
  },
  contactSub: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontSize: 11,
  },
  contactPhone: {
    ...Typography.label,
    color: Colors.primary[700],
    fontWeight: '700',
  },
});
