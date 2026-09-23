import { supabase } from '@/lib/supabase';
import type { Expense, ExpenseCategory } from '@/types/database';
import { logAuditAction } from '@/services/audit';

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  outstandingDues: number;
  thisMonthIncome: number;
  thisMonthExpenses: number;
}

/**
 * Fetch high-level financial summary for transparency (PRD v2 §14 & Roadmap Phase 5)
 */
export async function getFinancialSummary(): Promise<{
  data: FinancialSummary;
  error: Error | null;
}> {
  try {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];

    // 1. Total income from approved due payments
    const { data: approvedPayments, error: payError } = await supabase
      .from('due_payments')
      .select('amount, created_at')
      .eq('status', 'approved');

    if (payError) throw payError;

    let totalIncome = 0;
    let thisMonthIncome = 0;
    (approvedPayments || []).forEach((p) => {
      const amt = Number(p.amount) || 0;
      totalIncome += amt;
      if (p.created_at && p.created_at >= firstDayThisMonth) {
        thisMonthIncome += amt;
      }
    });

    // 2. Total expenses
    const { data: allExpenses, error: expError } = await supabase
      .from('expenses')
      .select('amount, expense_date');

    if (expError) throw expError;

    let totalExpenses = 0;
    let thisMonthExpenses = 0;
    (allExpenses || []).forEach((e) => {
      const amt = Number(e.amount) || 0;
      totalExpenses += amt;
      if (e.expense_date && e.expense_date >= firstDayThisMonth) {
        thisMonthExpenses += amt;
      }
    });

    // 3. Outstanding unpaid dues
    const { data: unpaidDues, error: dueError } = await supabase
      .from('due_assignments')
      .select('amount_snapshot')
      .eq('status', 'unpaid');

    if (dueError) throw dueError;

    let outstandingDues = 0;
    (unpaidDues || []).forEach((d) => {
      outstandingDues += Number(d.amount_snapshot) || 0;
    });

    const currentBalance = totalIncome - totalExpenses;

    return {
      data: {
        totalIncome,
        totalExpenses,
        currentBalance,
        outstandingDues,
        thisMonthIncome,
        thisMonthExpenses,
      },
      error: null,
    };
  } catch (err: any) {
    return {
      data: {
        totalIncome: 0,
        totalExpenses: 0,
        currentBalance: 0,
        outstandingDues: 0,
        thisMonthIncome: 0,
        thisMonthExpenses: 0,
      },
      error: new Error(err.message || 'Gagal memuat ringkasan keuangan'),
    };
  }
}

/**
 * Get list of all recorded expenses
 */
export async function getExpenses(filters?: {
  category?: ExpenseCategory;
  limit?: number;
}): Promise<{ data: Expense[]; error: Error | null }> {
  try {
    let query = supabase
      .from('expenses')
      .select('*, creator:profiles!created_by(id, full_name, avatar_path)')
      .order('expense_date', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data || []) as Expense[], error: null };
  } catch (err: any) {
    return { data: [], error: new Error(err.message) };
  }
}

/**
 * Record a new expense by manager (RT/RW/Developer)
 */
export async function createExpense(params: {
  title: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  description?: string;
  proofUrl?: string;
  rtId?: string;
  rwId?: string;
  createdBy: string;
}): Promise<{ data: Expense | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        title: params.title,
        category: params.category,
        amount: params.amount,
        expense_date: params.expenseDate,
        description: params.description || null,
        proof_url: params.proofUrl || null,
        rt_id: params.rtId || null,
        rw_id: params.rwId || null,
        created_by: params.createdBy,
      })
      .select()
      .single();

    if (error) return { data: null, error: new Error(error.message) };

    await logAuditAction({
      actorId: params.createdBy,
      action: 'expense_created',
      entityType: 'expense',
      entityId: data.id,
      metadata: {
        title: params.title,
        amount: params.amount,
        category: params.category,
      },
    });

    return { data: data as Expense, error: null };
  } catch (err: any) {
    return { data: null, error: new Error(err.message) };
  }
}

/**
 * Format currency helper
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
