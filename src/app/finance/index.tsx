import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  CaretLeft,
  TrendUp,
  TrendDown,
  Wallet,
  PlusCircle,
  Receipt,
  ShieldCheck,
  Trash,
  Wrench,
  Lightbulb,
  FileText,
  Users,
} from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useComplex } from '@/lib/complex-provider';
import {
  getFinancialSummary,
  getExpenses,
  formatCurrency,
  type FinancialSummary,
} from '@/services/finance';
import type { Expense, ExpenseCategory } from '@/types/database';

export default function FinanceScreen() {
  const { activeRole } = useComplex();
  const isManager = activeRole === 'developer' || activeRole === 'rw' || activeRole === 'rt';

  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    currentBalance: 0,
    outstandingDues: 0,
    thisMonthIncome: 0,
    thisMonthExpenses: 0,
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [sumRes, expRes] = await Promise.all([
        getFinancialSummary(),
        getExpenses(selectedCategory !== 'all' ? { category: selectedCategory } : undefined),
      ]);
      setSummary(sumRes.data);
      setExpenses(expRes.data);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return <ShieldCheck size={18} color="#2563EB" weight="bold" />;
      case 'waste':
        return <Trash size={18} color="#16A34A" weight="bold" />;
      case 'maintenance':
        return <Wrench size={18} color="#D97706" weight="bold" />;
      case 'utilities':
        return <Lightbulb size={18} color="#9333EA" weight="bold" />;
      case 'social':
        return <Users size={18} color="#EC4899" weight="bold" />;
      default:
        return <FileText size={18} color={Colors.stone[600]} weight="bold" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'security':
        return 'Keamanan / Satpam';
      case 'waste':
        return 'Kebersihan / Sampah';
      case 'maintenance':
        return 'Perbaikan Fasilitas';
      case 'utilities':
        return 'Listrik & Air Fasum';
      case 'administration':
        return 'Administrasi RT/RW';
      case 'social':
        return 'Kegiatan Warga';
      default:
        return 'Lainnya';
    }
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
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Transparansi Keuangan</Text>
            <Text style={styles.subtitle}>Buku kas digital komplek terbuka untuk seluruh warga.</Text>
          </View>
          {isManager && (
            <TouchableOpacity
              style={styles.addExpenseBtn}
              onPress={() => router.push('/finance/create' as any)}
            >
              <PlusCircle size={18} color="#FFFFFF" weight="bold" />
              <Text style={styles.addExpenseBtnText}>Catat</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary[600]]}
            />
          }
        >
          {/* Main Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <View style={styles.balanceIconWrap}>
                <Wallet size={20} color="#FFFFFF" weight="bold" />
              </View>
              <Text style={styles.balanceLabel}>SALDO KAS KOMPLEK</Text>
            </View>
            <Text style={styles.balanceAmount}>{formatCurrency(summary.currentBalance)}</Text>
            <Text style={styles.balanceSub}>
              Update realtime dari verifikasi pembayaran iuran & catatan pengeluaran
            </Text>
          </View>

          {/* Income & Expense Two-Col */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' }]}>
              <View style={styles.statHead}>
                <TrendUp size={16} color="#16A34A" weight="bold" />
                <Text style={[styles.statHeadLabel, { color: '#166534' }]}>TOTAL PEMASUKAN</Text>
              </View>
              <Text style={[styles.statVal, { color: '#15803D' }]}>
                {formatCurrency(summary.totalIncome)}
              </Text>
              <Text style={styles.statSub}>
                Bulan ini: {formatCurrency(summary.thisMonthIncome)}
              </Text>
            </View>

            <View style={[styles.statBox, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
              <View style={styles.statHead}>
                <TrendDown size={16} color="#DC2626" weight="bold" />
                <Text style={[styles.statHeadLabel, { color: '#991B1B' }]}>TOTAL PENGELUARAN</Text>
              </View>
              <Text style={[styles.statVal, { color: '#B91C1C' }]}>
                {formatCurrency(summary.totalExpenses)}
              </Text>
              <Text style={styles.statSub}>
                Bulan ini: {formatCurrency(summary.thisMonthExpenses)}
              </Text>
            </View>
          </View>

          {/* Outstanding Notice */}
          {summary.outstandingDues > 0 && (
            <View style={styles.outstandingCard}>
              <Text style={styles.outstandingLabel}>Tagihan Belum Tertagih / Tertunggak:</Text>
              <Text style={styles.outstandingValue}>
                {formatCurrency(summary.outstandingDues)}
              </Text>
            </View>
          )}

          {/* Expenses Filter */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>BUKU PENGELUARAN KAS</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBar}
          >
            {[
              { id: 'all', label: 'Semua' },
              { id: 'security', label: 'Keamanan' },
              { id: 'waste', label: 'Kebersihan' },
              { id: 'maintenance', label: 'Perbaikan' },
              { id: 'utilities', label: 'Utilitas' },
              { id: 'administration', label: 'Administrasi' },
              { id: 'social', label: 'Sosial' },
            ].map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterPill,
                  selectedCategory === cat.id && styles.filterPillActive,
                ]}
                onPress={() => setSelectedCategory(cat.id as any)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selectedCategory === cat.id && styles.filterPillTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Expenses List */}
          {expenses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Receipt size={36} color={Colors.stone[300]} />
              <Text style={styles.emptyTitle}>Belum Ada Catatan Pengeluaran</Text>
              <Text style={styles.emptyDesc}>
                Pengeluaran kas komplek yang telah dicatat pengurus akan tampil transparan di sini.
              </Text>
            </View>
          ) : (
            expenses.map((item) => (
              <View key={item.id} style={styles.expenseCard}>
                <View style={styles.expenseRow}>
                  <View style={styles.categoryIconWrap}>
                    {getCategoryIcon(item.category)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseTitle}>{item.title}</Text>
                    <Text style={styles.expenseMeta}>
                      {item.expense_date} • {getCategoryLabel(item.category)}
                    </Text>
                    {item.description ? (
                      <Text style={styles.expenseDesc}>{item.description}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.expenseAmount}>
                    - {formatCurrency(Number(item.amount))}
                  </Text>
                </View>

                {item.creator && (
                  <View style={styles.creatorRow}>
                    <Text style={styles.creatorText}>
                      Dicatat oleh: {item.creator.full_name || 'Pengurus'}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  addExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
  },
  addExpenseBtnText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing[4],
    gap: Spacing[3],
  },
  balanceCard: {
    backgroundColor: Colors.primary[700],
    borderRadius: Radius.lg,
    padding: Spacing[4],
    shadowColor: Colors.primary[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing[1],
  },
  balanceIconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: {
    ...Typography.overline,
    color: '#E0E7FF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 26,
    color: '#FFFFFF',
    marginVertical: 4,
  },
  balanceSub: {
    ...Typography.bodyS,
    color: '#C7D2FE',
    fontSize: 11,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  statBox: {
    flex: 1,
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  statHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statHeadLabel: {
    ...Typography.overline,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  statVal: {
    ...Typography.bodyM,
    fontWeight: '700',
    fontSize: 15,
  },
  statSub: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontSize: 11,
    marginTop: 2,
  },
  outstandingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.stone[100],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
  },
  outstandingLabel: {
    ...Typography.bodyS,
    color: Colors.stone[600],
  },
  outstandingValue: {
    ...Typography.bodyS,
    fontWeight: '700',
    color: Colors.stone[800],
  },
  sectionHeaderRow: {
    marginTop: Spacing[2],
  },
  sectionHeading: {
    ...Typography.overline,
    color: Colors.stone[500],
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  filterBar: {
    gap: Spacing[2],
    paddingVertical: Spacing[1],
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.stone[100],
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  filterPillActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  },
  filterPillText: {
    ...Typography.bodyS,
    color: Colors.stone[600],
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  expenseCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    gap: Spacing[2],
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
  },
  categoryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.stone[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseTitle: {
    ...Typography.bodyM,
    fontWeight: '600',
    color: Colors.stone[900],
  },
  expenseMeta: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginTop: 2,
  },
  expenseDesc: {
    ...Typography.bodyS,
    color: Colors.stone[600],
    marginTop: 4,
  },
  expenseAmount: {
    ...Typography.bodyM,
    fontWeight: '700',
    color: '#DC2626',
  },
  creatorRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.stone[100],
    paddingTop: 6,
  },
  creatorText: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    fontSize: 11,
  },
  emptyCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    padding: Spacing[6],
    alignItems: 'center',
    gap: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    marginTop: Spacing[4],
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.stone[900],
  },
  emptyDesc: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    textAlign: 'center',
  },
});
