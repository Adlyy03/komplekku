import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CaretDown, Check, ShieldCheck, User, Users, Buildings, X } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useComplex } from '@/lib/complex-provider';
import type { UserRole } from '@/types/database';

/**
 * CommunityHeader — PRD v2 §1, §4, §6
 * Displays single complex branding, current RT/RW unit, and role context switcher.
 */
export function CommunityHeader() {
  const { complexSettings, household, roles, activeRole, setActiveRole } = useComplex();
  const [modalVisible, setModalVisible] = useState(false);

  const rtCode = household?.rt?.code;
  const rwCode = household?.rw?.code;
  const unitLabel = rtCode && rwCode ? `RT ${rtCode} / RW ${rwCode}` : null;

  // Determine available switchable roles
  const hasManagementRole = roles.some((r) => r.role === 'developer' || r.role === 'rw' || r.role === 'rt');
  
  const roleOptions: { role: UserRole; title: string; desc: string; icon: any }[] = [
    ...(roles.some((r) => r.role === 'developer')
      ? [
          {
            role: 'developer' as UserRole,
            title: 'Developer / Pengelola',
            desc: 'Akses penuh pengaturan komplek, seluruh RT/RW & moderasi',
            icon: Buildings,
          },
        ]
      : []),
    ...(roles.some((r) => r.role === 'rw')
      ? [
          {
            role: 'rw' as UserRole,
            title: `Ketua RW ${rwCode ? `(${rwCode})` : ''}`,
            desc: 'Monitoring iuran, pengaduan & koordinasi RT di wilayah RW',
            icon: Users,
          },
        ]
      : []),
    ...(roles.some((r) => r.role === 'rt')
      ? [
          {
            role: 'rt' as UserRole,
            title: `Ketua RT ${rtCode ? `(${rtCode})` : ''}`,
            desc: 'Operasional warga RT, iuran RT & pengaduan RT',
            icon: ShieldCheck,
          },
        ]
      : []),
    {
      role: 'warga' as UserRole,
      title: 'Warga Komplek',
      desc: 'Layanan rumah sendiri, tagihan iuran, pasar warga & pengaduan',
      icon: User,
    },
  ];

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'developer':
        return 'DEVELOPER';
      case 'rw':
        return rwCode ? `RW ${rwCode}` : 'PENGURUS RW';
      case 'rt':
        return rtCode ? `RT ${rtCode}` : 'PENGURUS RT';
      case 'warga':
      default:
        return 'WARGA';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'developer':
        return '#6D28D9'; // Purple
      case 'rw':
        return '#047857'; // Deep emerald
      case 'rt':
        return '#0D9488'; // Teal
      case 'warga':
      default:
        return Colors.stone[600];
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <View style={styles.badgeRow}>
          <Text style={styles.overline}>KOMPLEK RESIDENSIAL</Text>

          {hasManagementRole ? (
            <TouchableOpacity
              style={[styles.roleBadgeTouchable, { backgroundColor: getRoleColor(activeRole) }]}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.roleBadgeText}>{getRoleLabel(activeRole)}</Text>
              <CaretDown size={11} color="#FFFFFF" weight="bold" />
            </TouchableOpacity>
          ) : (
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(activeRole) }]}>
              <Text style={styles.roleBadgeText}>{getRoleLabel(activeRole)}</Text>
            </View>
          )}
        </View>

        <Text style={styles.complexName} numberOfLines={1}>
          {complexSettings.name}
        </Text>
        {unitLabel && (
          <Text style={styles.unitLabel} numberOfLines={1}>
            {unitLabel}
          </Text>
        )}
      </View>

      {/* Role Switcher Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Ganti Tampilan Peran</Text>
                <Text style={styles.modalSubtitle}>Pilih mode peran yang ingin Anda gunakan:</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={8}>
                <X size={20} color={Colors.stone[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.roleList}>
              {roleOptions.map((opt) => {
                const isSelected = activeRole === opt.role;
                const IconComponent = opt.icon;
                return (
                  <TouchableOpacity
                    key={opt.role}
                    style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
                    onPress={() => {
                      setActiveRole(opt.role);
                      setModalVisible(false);
                    }}
                  >
                    <View
                      style={[
                        styles.roleIconCircle,
                        { backgroundColor: isSelected ? Colors.primary[50] : Colors.stone[100] },
                      ]}
                    >
                      <IconComponent
                        size={20}
                        color={isSelected ? Colors.primary[700] : Colors.stone[700]}
                        weight={isSelected ? 'fill' : 'regular'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.roleOptionTitle, isSelected && styles.roleOptionTitleSelected]}>
                        {opt.title}
                      </Text>
                      <Text style={styles.roleOptionDesc}>{opt.desc}</Text>
                    </View>
                    {isSelected && <Check size={18} color={Colors.primary[700]} weight="bold" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing[1],
  },
  textContainer: {
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  overline: {
    ...Typography.overline,
    color: Colors.stone[400],
    fontSize: 10,
    letterSpacing: 0.8,
  },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  roleBadgeTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  complexName: {
    ...Typography.h3,
    color: Colors.stone[800],
    maxWidth: 260,
  },
  unitLabel: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontSize: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[4],
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.stone[900],
  },
  modalSubtitle: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginTop: 2,
  },
  roleList: {
    gap: Spacing[2],
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    backgroundColor: '#FFFFFF',
  },
  roleOptionSelected: {
    borderColor: Colors.primary[600],
    backgroundColor: Colors.primary[50],
  },
  roleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOptionTitle: {
    ...Typography.bodyM,
    fontWeight: '700',
    color: Colors.stone[800],
  },
  roleOptionTitleSelected: {
    color: Colors.primary[900],
  },
  roleOptionDesc: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontSize: 11,
    marginTop: 1,
  },
});
