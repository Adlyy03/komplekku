import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  Pressable,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import {
  House,
  Users,
  Receipt,
  WarningCircle,
  Megaphone,
  ShieldCheck,
  Storefront,
  Buildings,
  Bell,
  ChatCircle,
  CaretRight,
  CaretLeft,
  UserCircle,
  Wallet,
  ShoppingBag,
  Warning,
  QrCode,
  SidebarSimple,
} from 'phosphor-react-native';
import { Colors, Radius, Spacing, FontFamily, MAX_CONTENT_WIDTH } from '@/constants/theme';
import { useSupabase } from '@/lib/supabase-provider';
import { useComplex } from '@/lib/complex-provider';

/** Breakpoint for tablet / sidebar rail */
export const TABLET_BREAKPOINT = 768;
/** Breakpoint for full desktop sidebar */
export const DESKTOP_BREAKPOINT = 1024;

/** Whether current viewport is tablet or desktop */
export function useIsDesktop() {
  const { width } = useWindowDimensions();
  return width >= TABLET_BREAKPOINT;
}

/** Context to avoid nested duplicate shells */
const DesktopShellContext = createContext<boolean>(false);

export interface SidebarItem {
  key: string;
  label: string;
  icon: (color: string) => React.ReactNode;
  href: string;
  badge?: number;
  isDestructive?: boolean;
}

export interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

interface DesktopShellProps {
  /** Active route key used to highlight the correct sidebar item */
  activeKey?: string;
  /** Page title shown in the topbar */
  pageTitle?: string;
  /** Breadcrumb trail */
  breadcrumb?: string[];
  /** Right-side action slot in topbar */
  headerAction?: React.ReactNode;
  /** Force fluid full-width content without max-width constraint */
  fluid?: boolean;
  children: React.ReactNode;
}

/**
 * DesktopShell — desain.md §11 & §23
 * Shared, persistent responsive sidebar & topbar layout for ALL ROLES (Developer, RW, RT, Warga).
 * - Mobile (< 768px): Renders children bare.
 * - Tablet (768 - 1023px): Persistent 72px icon rail (expandable).
 * - Desktop (>= 1024px): Persistent 240px sidebar (collapsible).
 */
export function DesktopShell({
  activeKey,
  pageTitle,
  breadcrumb,
  headerAction,
  fluid = false,
  children,
}: DesktopShellProps) {
  const isAlreadyInShell = useContext(DesktopShellContext);
  const { width } = useWindowDimensions();
  const isDesktop = width >= TABLET_BREAKPOINT;
  const isWideScreen = width >= DESKTOP_BREAKPOINT;

  // Collapse state: auto-collapse on tablet, expanded on large desktop
  const [collapsed, setCollapsed] = useState<boolean>(!isWideScreen);

  const { profile } = useSupabase();
  const { complexSettings, activeRole, isDeveloper, isRw, isRt } = useComplex();
  const pathname = usePathname();

  const resolvedActiveKey = activeKey ?? pathname;

  // Build role-tailored sidebar groups based strictly on permissions
  const navGroups: SidebarGroup[] = useMemo(() => {
    if (activeRole === 'developer') {
      return [
        {
          title: 'UTAMA',
          items: [
            {
              key: '/(main)',
              label: 'Ringkasan Eksekutif',
              icon: (c) => <House size={18} color={c} weight="fill" />,
              href: '/(main)',
            },
            {
              key: '/warga',
              label: 'Data Warga & Hunian',
              icon: (c) => <Users size={18} color={c} weight="fill" />,
              href: '/warga',
            },
            {
              key: '/admin',
              label: 'Panel Pengelola Master',
              icon: (c) => <ShieldCheck size={18} color={c} weight="fill" />,
              href: '/admin',
            },
          ],
        },
        {
          title: 'KEUANGAN & KAS',
          items: [
            {
              key: '/iuran',
              label: 'Iuran & Tagihan',
              icon: (c) => <Receipt size={18} color={c} weight="fill" />,
              href: '/(main)/iuran',
            },
            {
              key: '/finance',
              label: 'Buku Kas Komplek',
              icon: (c) => <Wallet size={18} color={c} weight="fill" />,
              href: '/finance',
            },
          ],
        },
        {
          title: 'PELAYANAN & KOMUNITAS',
          items: [
            {
              key: '/pengaduan',
              label: 'Pengaduan Lingkungan',
              icon: (c) => <WarningCircle size={18} color={c} weight="fill" />,
              href: '/pengaduan',
            },
            {
              key: '/announcements',
              label: 'Pengumuman Komplek',
              icon: (c) => <Megaphone size={18} color={c} weight="fill" />,
              href: '/announcements',
            },
            {
              key: '/chat',
              label: 'Pesan Warga',
              icon: (c) => <ChatCircle size={18} color={c} weight="fill" />,
              href: '/chat',
            },
          ],
        },
        {
          title: 'PASAR & TRANSAKSI',
          items: [
            {
              key: '/marketplace',
              label: 'Pasar Komplek',
              icon: (c) => <Storefront size={18} color={c} weight="fill" />,
              href: '/(main)/marketplace',
            },
            {
              key: '/orders',
              label: 'Transaksi Pesanan',
              icon: (c) => <ShoppingBag size={18} color={c} weight="fill" />,
              href: '/(main)/orders',
            },
          ],
        },
        {
          title: 'KEAMANAN',
          items: [
            {
              key: '/security/visitor',
              label: 'Buku Tamu Digital',
              icon: (c) => <QrCode size={18} color={c} weight="fill" />,
              href: '/security/visitor',
            },
            {
              key: '/security/sos',
              label: 'Monitoring SOS',
              icon: (c) => <Warning size={18} color={c} weight="fill" />,
              href: '/security/sos',
              isDestructive: true,
            },
          ],
        },
        {
          title: 'PENGATURAN',
          items: [
            {
              key: '/profile',
              label: 'Profil Pengelola',
              icon: (c) => <UserCircle size={18} color={c} weight="fill" />,
              href: '/(main)/profile',
            },
          ],
        },
      ];
    }

    if (activeRole === 'rw') {
      return [
        {
          title: 'UTAMA',
          items: [
            {
              key: '/(main)',
              label: 'Dashboard RW',
              icon: (c) => <House size={18} color={c} weight="fill" />,
              href: '/(main)',
            },
            {
              key: '/warga',
              label: 'Data Warga RW',
              icon: (c) => <Users size={18} color={c} weight="fill" />,
              href: '/warga',
            },
            {
              key: '/admin',
              label: 'Panel Pengurus RW',
              icon: (c) => <ShieldCheck size={18} color={c} weight="fill" />,
              href: '/admin',
            },
          ],
        },
        {
          title: 'KEUANGAN & KAS',
          items: [
            {
              key: '/iuran',
              label: 'Iuran & Tagihan RW',
              icon: (c) => <Receipt size={18} color={c} weight="fill" />,
              href: '/(main)/iuran',
            },
            {
              key: '/finance',
              label: 'Buku Kas RW',
              icon: (c) => <Wallet size={18} color={c} weight="fill" />,
              href: '/finance',
            },
          ],
        },
        {
          title: 'PELAYANAN & KOMUNITAS',
          items: [
            {
              key: '/pengaduan',
              label: 'Pengaduan RW',
              icon: (c) => <WarningCircle size={18} color={c} weight="fill" />,
              href: '/pengaduan',
            },
            {
              key: '/announcements',
              label: 'Pengumuman RW',
              icon: (c) => <Megaphone size={18} color={c} weight="fill" />,
              href: '/announcements',
            },
            {
              key: '/chat',
              label: 'Pesan Warga',
              icon: (c) => <ChatCircle size={18} color={c} weight="fill" />,
              href: '/chat',
            },
          ],
        },
        {
          title: 'PASAR & EKONOMI',
          items: [
            {
              key: '/marketplace',
              label: 'Pasar Komplek',
              icon: (c) => <Storefront size={18} color={c} weight="fill" />,
              href: '/(main)/marketplace',
            },
            {
              key: '/orders',
              label: 'Pesanan Saya',
              icon: (c) => <ShoppingBag size={18} color={c} weight="fill" />,
              href: '/(main)/orders',
            },
          ],
        },
        {
          title: 'KEAMANAN',
          items: [
            {
              key: '/security/visitor',
              label: 'Buku Tamu RW',
              icon: (c) => <QrCode size={18} color={c} weight="fill" />,
              href: '/security/visitor',
            },
            {
              key: '/security/sos',
              label: 'Monitoring SOS',
              icon: (c) => <Warning size={18} color={c} weight="fill" />,
              href: '/security/sos',
              isDestructive: true,
            },
          ],
        },
        {
          title: 'AKUN',
          items: [
            {
              key: '/profile',
              label: 'Profil Pengurus',
              icon: (c) => <UserCircle size={18} color={c} weight="fill" />,
              href: '/(main)/profile',
            },
          ],
        },
      ];
    }

    if (activeRole === 'rt') {
      return [
        {
          title: 'UTAMA',
          items: [
            {
              key: '/(main)',
              label: 'Dashboard RT',
              icon: (c) => <House size={18} color={c} weight="fill" />,
              href: '/(main)',
            },
            {
              key: '/warga',
              label: 'Data Warga RT',
              icon: (c) => <Users size={18} color={c} weight="fill" />,
              href: '/warga',
            },
            {
              key: '/admin',
              label: 'Panel Pengurus RT',
              icon: (c) => <ShieldCheck size={18} color={c} weight="fill" />,
              href: '/admin',
            },
          ],
        },
        {
          title: 'KEUANGAN',
          items: [
            {
              key: '/iuran',
              label: 'Iuran & Verifikasi RT',
              icon: (c) => <Receipt size={18} color={c} weight="fill" />,
              href: '/(main)/iuran',
            },
          ],
        },
        {
          title: 'PELAYANAN & KOMUNITAS',
          items: [
            {
              key: '/pengaduan',
              label: 'Pengaduan Warga RT',
              icon: (c) => <WarningCircle size={18} color={c} weight="fill" />,
              href: '/pengaduan',
            },
            {
              key: '/announcements',
              label: 'Pengumuman RT',
              icon: (c) => <Megaphone size={18} color={c} weight="fill" />,
              href: '/announcements',
            },
            {
              key: '/chat',
              label: 'Pesan Warga',
              icon: (c) => <ChatCircle size={18} color={c} weight="fill" />,
              href: '/chat',
            },
          ],
        },
        {
          title: 'PASAR & EKONOMI',
          items: [
            {
              key: '/marketplace',
              label: 'Pasar Komplek',
              icon: (c) => <Storefront size={18} color={c} weight="fill" />,
              href: '/(main)/marketplace',
            },
            {
              key: '/orders',
              label: 'Pesanan Saya',
              icon: (c) => <ShoppingBag size={18} color={c} weight="fill" />,
              href: '/(main)/orders',
            },
          ],
        },
        {
          title: 'KEAMANAN',
          items: [
            {
              key: '/security/visitor',
              label: 'Buku Tamu RT',
              icon: (c) => <QrCode size={18} color={c} weight="fill" />,
              href: '/security/visitor',
            },
            {
              key: '/security/sos',
              label: 'Monitoring SOS',
              icon: (c) => <Warning size={18} color={c} weight="fill" />,
              href: '/security/sos',
              isDestructive: true,
            },
          ],
        },
        {
          title: 'AKUN',
          items: [
            {
              key: '/profile',
              label: 'Profil Pengurus RT',
              icon: (c) => <UserCircle size={18} color={c} weight="fill" />,
              href: '/(main)/profile',
            },
          ],
        },
      ];
    }

    // Role: Warga (Default)
    return [
      {
        title: 'UTAMA',
        items: [
          {
            key: '/(main)',
            label: 'Beranda',
            icon: (c) => <House size={18} color={c} weight="fill" />,
            href: '/(main)',
          },
          {
            key: '/warga',
            label: 'Rumah & Keluarga',
            icon: (c) => <Users size={18} color={c} weight="fill" />,
            href: '/warga',
          },
        ],
      },
      {
        title: 'TAGIHAN & KEUANGAN',
        items: [
          {
            key: '/iuran',
            label: 'Tagihan Iuran Saya',
            icon: (c) => <Receipt size={18} color={c} weight="fill" />,
            href: '/(main)/iuran',
          },
        ],
      },
      {
        title: 'PELAYANAN & KOMUNITAS',
        items: [
          {
            key: '/pengaduan',
            label: 'Pengaduan Saya',
            icon: (c) => <WarningCircle size={18} color={c} weight="fill" />,
            href: '/pengaduan',
          },
          {
            key: '/announcements',
            label: 'Pengumuman',
            icon: (c) => <Megaphone size={18} color={c} weight="fill" />,
            href: '/announcements',
          },
          {
            key: '/chat',
            label: 'Pesan Warga',
            icon: (c) => <ChatCircle size={18} color={c} weight="fill" />,
            href: '/chat',
          },
        ],
      },
      {
        title: 'PASAR & BELANJA',
        items: [
          {
            key: '/marketplace',
            label: 'Pasar Komplek',
            icon: (c) => <Storefront size={18} color={c} weight="fill" />,
            href: '/(main)/marketplace',
          },
          {
            key: '/orders',
            label: 'Pesanan Saya',
            icon: (c) => <ShoppingBag size={18} color={c} weight="fill" />,
            href: '/(main)/orders',
          },
          {
            key: '/seller',
            label: 'Toko Saya',
            icon: (c) => <Storefront size={18} color={c} weight="fill" />,
            href: '/seller',
          },
        ],
      },
      {
        title: 'KEAMANAN',
        items: [
          {
            key: '/security/visitor',
            label: 'Buku Tamu Saya',
            icon: (c) => <QrCode size={18} color={c} weight="fill" />,
            href: '/security/visitor',
          },
          {
            key: '/security/sos',
            label: 'Tombol SOS Darurat',
            icon: (c) => <Warning size={18} color={c} weight="fill" />,
            href: '/security/sos',
            isDestructive: true,
          },
        ],
      },
      {
        title: 'AKUN',
        items: [
          {
            key: '/profile',
            label: 'Profil & Kartu Keluarga',
            icon: (c) => <UserCircle size={18} color={c} weight="fill" />,
            href: '/(main)/profile',
          },
        ],
      },
    ];
  }, [activeRole]);

  const firstName = profile?.full_name?.split(' ')[0] || 'Warga';
  const roleLabel = isDeveloper
    ? 'Master Developer'
    : isRw
    ? 'Pengurus RW'
    : isRt
    ? 'Pengurus RT'
    : 'Warga Residen';

  const checkIsItemActive = (itemKey: string) => {
    if (itemKey === '/(main)') {
      return (
        resolvedActiveKey === '/' ||
        resolvedActiveKey === '/(main)' ||
        resolvedActiveKey === '/(main)/index'
      );
    }
    return resolvedActiveKey.startsWith(itemKey);
  };

  const sidebarWidth = collapsed ? 72 : 240;

  // On mobile or if already wrapped inside another shell, render children directly
  if (!isDesktop || isAlreadyInShell) {
    return <>{children}</>;
  }

  return (
    <DesktopShellContext.Provider value={true}>
      <View style={styles.shell}>
        {/* ===================== SIDEBAR ===================== */}
        <View style={[styles.sidebar, { width: sidebarWidth }]}>
          {/* Brand & Collapse Header */}
          <View style={[styles.sidebarBrand, collapsed && styles.sidebarBrandCollapsed]}>
            <View style={styles.brandMark}>
              <Buildings size={18} color={Colors.primary[600]} weight="fill" />
            </View>
            {!collapsed && (
              <View style={{ flex: 1 }}>
                <Text style={styles.brandName} numberOfLines={1}>
                  {complexSettings?.name || 'Komplekku'}
                </Text>
                <View style={styles.roleTagWrap}>
                  <Text style={styles.brandRole}>{roleLabel}</Text>
                </View>
              </View>
            )}
            <TouchableOpacity
              style={styles.collapseToggleBtn}
              onPress={() => setCollapsed(!collapsed)}
              accessibilityLabel={collapsed ? 'Perluas Menu' : 'Perkecil Menu'}
            >
              {collapsed ? (
                <SidebarSimple size={16} color={Colors.stone[600]} />
              ) : (
                <CaretLeft size={16} color={Colors.stone[500]} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.sidebarDivider} />

          {/* Navigation Links Scroll */}
          <ScrollView
            style={styles.navList}
            contentContainerStyle={styles.navListContent}
            showsVerticalScrollIndicator={false}
          >
            {navGroups.map((group, groupIdx) => (
              <View key={group.title + groupIdx} style={styles.navGroup}>
                {!collapsed && (
                  <Text style={styles.navGroupTitle}>{group.title}</Text>
                )}
                {group.items.map((item) => {
                  const isActive = checkIsItemActive(item.key);
                  const iconColor = isActive
                    ? Colors.primary[700]
                    : item.isDestructive
                    ? Colors.semantic.error[700]
                    : Colors.stone[500];

                  return (
                    <Pressable
                      key={item.key + item.label}
                      style={({ hovered }) => [
                        styles.navItem,
                        collapsed && styles.navItemCollapsed,
                        isActive && styles.navItemActive,
                        hovered && !isActive && styles.navItemHover,
                      ]}
                      onPress={() => router.push(item.href as any)}
                    >
                      <View style={styles.navIcon}>
                        {item.icon(iconColor)}
                      </View>
                      {!collapsed && (
                        <Text
                          style={[
                            styles.navLabel,
                            item.isDestructive && styles.navLabelDestructive,
                            isActive && styles.navLabelActive,
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                      )}
                      {!collapsed && item.badge ? (
                        <View style={styles.navBadge}>
                          <Text style={styles.navBadgeText}>{item.badge}</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          <View style={styles.sidebarDivider} />

          {/* User Profile Footer */}
          <TouchableOpacity
            style={[styles.sidebarProfile, collapsed && styles.sidebarProfileCollapsed]}
            onPress={() => router.push('/(main)/profile' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {profile?.full_name ? profile.full_name[0]?.toUpperCase() : 'W'}
              </Text>
            </View>
            {!collapsed && (
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {firstName}
                </Text>
                <Text style={styles.profileRole}>{roleLabel}</Text>
              </View>
            )}
            {!collapsed && <CaretRight size={14} color={Colors.stone[400]} />}
          </TouchableOpacity>
        </View>

        {/* ===================== MAIN CONTENT AREA ===================== */}
        <View style={styles.mainArea}>
          {/* Topbar */}
          <View style={styles.topbar}>
            <View style={styles.topbarLeft}>
              {breadcrumb && breadcrumb.length > 0 && (
                <View style={styles.breadcrumb}>
                  {breadcrumb.map((crumb, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <Text style={styles.breadcrumbSep}>/</Text>}
                      <Text
                        style={[
                          styles.breadcrumbItem,
                          i === breadcrumb.length - 1 && styles.breadcrumbItemActive,
                        ]}
                      >
                        {crumb}
                      </Text>
                    </React.Fragment>
                  ))}
                </View>
              )}
              {pageTitle && <Text style={styles.topbarTitle}>{pageTitle}</Text>}
            </View>

            <View style={styles.topbarRight}>
              {headerAction}

              <TouchableOpacity
                style={styles.topbarIconBtn}
                onPress={() => router.push('/chat' as any)}
                accessibilityLabel="Pesan Warga"
              >
                <ChatCircle size={18} color={Colors.stone[600]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.topbarIconBtn}
                onPress={() => router.push('/notifications' as any)}
                accessibilityLabel="Notifikasi"
              >
                <Bell size={18} color={Colors.stone[600]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.topbarProfileChip}
                onPress={() => router.push('/(main)/profile' as any)}
              >
                <View style={styles.topbarAvatar}>
                  <Text style={styles.topbarAvatarText}>
                    {profile?.full_name ? profile.full_name[0]?.toUpperCase() : 'W'}
                  </Text>
                </View>
                <View style={styles.topbarUserTextWrap}>
                  <Text style={styles.topbarUserName} numberOfLines={1}>
                    {firstName}
                  </Text>
                  <Text style={styles.topbarUserRole}>{roleLabel}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Page Body with Max Width centering */}
          <View style={styles.contentWrapper}>
            <View style={[styles.contentInner, fluid && styles.contentInnerFluid]}>
              {children}
            </View>
          </View>
        </View>
      </View>
    </DesktopShellContext.Provider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.stone[25],
    height: '100%',
    overflow: 'hidden',
  },

  // — Sidebar Layout —
  sidebar: {
    backgroundColor: Colors.stone[0],
    borderRightWidth: 1,
    borderRightColor: Colors.stone[100],
    flexDirection: 'column',
    height: '100%',
  },
  sidebarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    minHeight: 56,
  },
  sidebarBrandCollapsed: {
    paddingHorizontal: Spacing[3],
    justifyContent: 'center',
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontFamily: FontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.stone[900],
  },
  roleTagWrap: {
    marginTop: 1,
  },
  brandRole: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    color: Colors.primary[700],
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  collapseToggleBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.stone[50],
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: Colors.stone[100],
    marginHorizontal: Spacing[3],
  },
  navList: {
    flex: 1,
  },
  navListContent: {
    paddingVertical: Spacing[3],
    gap: Spacing[4],
  },
  navGroup: {
    gap: 2,
  },
  navGroupTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: Colors.stone[400],
    letterSpacing: 0.6,
    paddingHorizontal: Spacing[4],
    marginBottom: 4,
    fontWeight: '700',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginHorizontal: Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    marginHorizontal: Spacing[2],
  },
  navItemActive: {
    backgroundColor: Colors.primary[50],
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary[600],
  },
  navItemHover: {
    backgroundColor: Colors.stone[50],
  },
  navIcon: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.stone[600],
    flex: 1,
  },
  navLabelDestructive: {
    color: Colors.semantic.error[700],
  },
  navLabelActive: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.primary[800],
    fontWeight: '700',
  },
  navBadge: {
    backgroundColor: Colors.semantic.error[500],
    borderRadius: Radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  navBadgeText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sidebarProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  sidebarProfileCollapsed: {
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary[700],
  },
  profileName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.stone[800],
  },
  profileRole: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.stone[400],
  },

  // — Main Area Layout —
  mainArea: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.stone[0],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
    minHeight: 56,
  },
  topbarLeft: {
    flex: 1,
    gap: 2,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breadcrumbItem: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.stone[400],
  },
  breadcrumbItemActive: {
    color: Colors.stone[600],
    fontFamily: FontFamily.bodySemiBold,
  },
  breadcrumbSep: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.stone[300],
  },
  topbarTitle: {
    fontFamily: FontFamily.display,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.stone[800],
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  topbarIconBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    backgroundColor: Colors.stone[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbarProfileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 6,
    paddingRight: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.stone[50],
    borderWidth: 1,
    borderColor: Colors.stone[100],
    marginLeft: 4,
  },
  topbarAvatar: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbarAvatarText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary[700],
  },
  topbarUserTextWrap: {
    gap: 1,
  },
  topbarUserName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.stone[800],
  },
  topbarUserRole: {
    fontFamily: FontFamily.body,
    fontSize: 9,
    color: Colors.stone[400],
  },

  // Content centering container
  contentWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  contentInner: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  contentInnerFluid: {
    maxWidth: '100%',
  },
});
