/**
 * Komplekku — Shared TypeScript types & Database Entity Interfaces (MVP v2)
 * PRD v2 §4, §10, §13, §14, §16, §23
 */

export * from './database';

/** User roles per PRD v2 §4 */
export type UserRole = 'developer' | 'rw' | 'rt' | 'warga';

/** Resident verification status per PRD v2 §10 */
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

/** Resident activity status per PRD v2 §10 */
export type ResidentStatus = 'pending' | 'active' | 'inactive' | 'blocked';

/** House occupancy status */
export type HouseStatus = 'occupied' | 'vacant' | 'inactive';

/** Announcement scope & status */
export type AnnouncementTarget = 'complex' | 'rw' | 'rt';
export type AnnouncementStatus = 'draft' | 'published' | 'archived';

/** Dues billing & payment status per PRD v2 §13 */
export type DueFrequency = 'monthly' | 'one_time';
export type DueAssignmentStatus =
  | 'unpaid'
  | 'pending_verification'
  | 'paid'
  | 'rejected'
  | 'cancelled';
export type DuePaymentMethod = 'manual' | 'cash' | 'bank_transfer' | 'other';
export type DuePaymentStatus = 'pending_verification' | 'approved' | 'rejected';

/** Product type & status per PRD v2 §14 */
export type ProductType = 'product' | 'service';
export type ProductCondition = 'new' | 'like_new' | 'used';
export type ProductStatus = 'draft' | 'active' | 'inactive' | 'sold_out';

/** Seller status per PRD v2 §14 */
export type SellerStatus = 'active' | 'inactive' | 'blocked';

/** Order status & payment status per PRD v2 §14 */
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'completed'
  | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'cancelled';
export type DeliveryMethod = 'pickup' | 'manual_delivery';

/** Complaint priority & status per PRD v2 §16 */
export type ComplaintPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ComplaintStatus =
  | 'submitted'
  | 'in_review'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'closed';

/** Notification types per PRD v2 §17 */
export type NotificationType =
  | 'announcement'
  | 'due'
  | 'payment'
  | 'order'
  | 'chat'
  | 'complaint'
  | 'system';
