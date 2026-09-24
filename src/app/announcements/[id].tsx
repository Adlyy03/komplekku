import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { getAnnouncementDetail, type AnnouncementWithAuthor } from '@/services/announcements';
import { LoadingState } from '@/components/ui/LoadingState';
import { DesktopShell, useIsDesktop } from '@/components/ui/DesktopShell';

/**
 * Announcement Detail Screen — PRD v2 §12
 */
export default function AnnouncementDetailScreen() {
  const isDesktop = useIsDesktop();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [announcement, setAnnouncement] = useState<AnnouncementWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getAnnouncementDetail(id).then(({ data }) => {
      setAnnouncement(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <LoadingState />;
  }

  if (!announcement) {
    return (
      <DesktopShell
        activeKey="/announcements"
        pageTitle="Pengumuman Tidak Ditemukan"
        breadcrumb={['Komunikasi', 'Pengumuman']}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/announcements' as any))}
              hitSlop={8}
              style={styles.backButton}
            >
              <CaretLeft size={20} color={Colors.stone[700]} />
              <Text style={styles.backButtonText}>Kembali</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Pengumuman Tidak Ditemukan</Text>
          </View>
        </SafeAreaView>
      </DesktopShell>
    );
  }

  return (
    <DesktopShell
      activeKey="/announcements"
      pageTitle="Detail Pengumuman"
      breadcrumb={['Komunikasi', 'Pengumuman', announcement.title]}
    >
      <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top', 'bottom']}>
        {/* Header */}
        {!isDesktop && (
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/announcements' as any))}
              hitSlop={8}
              style={styles.backButton}
            >
              <CaretLeft size={20} color={Colors.stone[700]} />
              <Text style={styles.backButtonText}>Kembali</Text>
            </TouchableOpacity>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {announcement.target_type === 'complex'
                  ? 'PENGUMUMAN KOMPLEK'
                  : announcement.target_type === 'rw'
                  ? 'PENGUMUMAN TINGKAT RW'
                  : 'PENGUMUMAN TINGKAT RT'}
              </Text>
            </View>
          </View>
        )}

        <ScrollView contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}>
          <Text style={styles.announcementTitle}>{announcement.title}</Text>
          <Text style={styles.metaText}>
            Diterbitkan pada{' '}
            {new Date(announcement.publish_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            oleh {announcement.author?.full_name || 'Pengurus'}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.announcementBody}>{announcement.body}</Text>
        </ScrollView>
      </SafeAreaView>
    </DesktopShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.stone[0],
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
    color: Colors.stone[800],
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  badgeText: {
    ...Typography.overline,
    color: Colors.primary[700],
    fontSize: 10,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing[5],
    paddingBottom: Spacing[10],
  },
  announcementTitle: {
    ...Typography.h1,
    color: Colors.stone[800],
    fontSize: 22,
    lineHeight: 28,
    marginBottom: Spacing[2],
  },
  metaText: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.stone[100],
    marginVertical: Spacing[4],
  },
  announcementBody: {
    ...Typography.bodyL,
    color: Colors.stone[700],
    lineHeight: 26,
    fontSize: 15,
  },
  desktopScrollContent: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: Spacing[6],
  },
});
