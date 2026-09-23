/**
 * Komplekku Database Types (MVP v2)
 * Schema based on komplekku_mvp_schema_v2.sql & PRD_Komplekku_MVP_v2.md
 * 1 Complex = 1 App Deployment = 1 Supabase Project (27 Tables)
 */

export type UserRole = 'developer' | 'rw' | 'rt' | 'warga';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type ResidentStatus = 'pending' | 'active' | 'inactive' | 'blocked';
export type HouseStatus = 'occupied' | 'vacant' | 'inactive';
export type AnnouncementTarget = 'complex' | 'rw' | 'rt';
export type AnnouncementStatus = 'draft' | 'published' | 'archived';
export type DueFrequency = 'monthly' | 'one_time';
export type DueAssignmentStatus =
  | 'unpaid'
  | 'pending_verification'
  | 'paid'
  | 'rejected'
  | 'cancelled';
export type DuePaymentMethod = 'manual' | 'cash' | 'bank_transfer' | 'other';
export type DuePaymentStatus = 'pending_verification' | 'approved' | 'rejected';
export type ProductType = 'product' | 'service';
export type ProductCondition = 'new' | 'like_new' | 'used';
export type ProductStatus = 'draft' | 'active' | 'inactive' | 'sold_out';
export type SellerStatus = 'active' | 'inactive' | 'blocked';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'completed'
  | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'cancelled';
export type DeliveryMethod = 'pickup' | 'manual_delivery' | 'delivery';
export type ComplaintPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ComplaintStatus =
  | 'submitted'
  | 'in_review'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'closed';
export type NotificationType =
  | 'announcement'
  | 'due'
  | 'payment'
  | 'order'
  | 'chat'
  | 'complaint'
  | 'emergency'
  | 'visitor'
  | 'system';

export interface ComplexSettings {
  id: number; // default 1
  name: string;
  logo_path: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  timezone: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string; // references auth.users(id)
  full_name: string;
  phone: string | null;
  avatar_path: string | null;
  resident_status: ResidentStatus;
  verification_status: VerificationStatus;
  nik?: string | null;
  gender?: 'male' | 'female' | null;
  birth_place?: string | null;
  birth_date?: string | null;
  religion?: string | null;
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed' | null;
  occupation?: string | null;
  blood_type?: 'A' | 'B' | 'AB' | 'O' | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
  kk_number?: string | null;
  family_code?: string | null;
  created_at: string;
  updated_at: string;
  // Backward compatibility fields:
  phone_number?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

export type FamilyRelationship =
  | 'head'
  | 'spouse'
  | 'child'
  | 'parent'
  | 'sibling'
  | 'other';

export interface FamilyMember {
  id: string;
  house_id: string;
  head_user_id: string;
  user_id: string | null;
  full_name: string;
  nik: string | null;
  relationship: FamilyRelationship;
  gender: 'male' | 'female' | null;
  birth_place: string | null;
  birth_date: string | null;
  religion: string | null;
  occupation: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile | null;
}

export interface RwUnit {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface RtUnit {
  id: string;
  rw_id: string;
  code: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  rw?: RwUnit;
}

export interface House {
  id: string;
  rw_id: string;
  rt_id: string;
  block: string | null;
  house_number: string;
  address_label: string | null;
  status: HouseStatus;
  family_code?: string | null;
  created_at: string;
  updated_at: string;
  rw?: RwUnit;
  rt?: RtUnit;
}

export interface HouseholdMember {
  id: string;
  house_id: string;
  user_id: string;
  relationship: string;
  is_primary: boolean;
  status: 'active' | 'inactive';
  joined_at: string;
  created_at: string;
  updated_at: string;
  house?: House;
  profile?: Profile;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  rw_id: string | null;
  rt_id: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Announcement {
  id: string;
  author_id: string;
  title: string;
  body: string;
  image_path: string | null;
  target_type: AnnouncementTarget;
  target_rw_id: string | null;
  target_rt_id: string | null;
  status: AnnouncementStatus;
  publish_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  reference_type: string | null;
  reference_id: string | null;
  read_at: string | null;
  created_at: string;
}

export interface Due {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  billing_frequency: DueFrequency;
  due_day: number | null;
  status: 'active' | 'inactive';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DueAssignment {
  id: string;
  due_id: string;
  house_id: string;
  period_start: string;
  period_end: string;
  due_date: string | null;
  amount_snapshot: number;
  status: DueAssignmentStatus;
  created_at: string;
  updated_at: string;
  due?: Due;
  house?: House;
}

export interface DuePayment {
  id: string;
  assignment_id: string;
  paid_by_user_id: string;
  amount: number;
  method: DuePaymentMethod;
  proof_path: string | null;
  status: DuePaymentStatus;
  submitted_at: string;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  assignment?: DueAssignment;
  paid_by?: Profile;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  store_name: string;
  description: string | null;
  avatar_path: string | null;
  status: SellerStatus;
  created_at: string;
  updated_at: string;
  user?: Profile;
  // Backward compatibility fields:
  avatar_url?: string | null;
  community_id?: string;
}

export interface Product {
  id: string;
  seller_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  type: ProductType;
  condition: ProductCondition | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  seller?: Partial<SellerProfile>;
  category?: Category;
  images?: ProductImage[];
  // Backward compatibility fields:
  community_id?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  sort_order: number;
  is_cover: boolean;
  created_at: string;
  // Backward compatibility fields:
  image_url?: string;
  is_primary?: boolean;
}

export interface Cart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  community_id?: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: any;
}

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  seller_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_method: DeliveryMethod;
  notes: string | null;
  created_at: string;
  updated_at: string;
  buyer?: Partial<Profile>;
  seller?: Partial<SellerProfile>;
  items?: OrderItem[];
  community_id?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  participants?: ConversationParticipant[];
  last_message?: Message;
  community_id?: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  created_at: string;
  profile?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  read_at: string | null;
  created_at: string;
  sender?: Profile;
}

export interface ComplaintCategory {
  id: string;
  name: string;
  sort_order: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Complaint {
  id: string;
  reporter_id: string;
  house_id: string | null;
  category_id: string;
  title: string;
  description: string;
  location_note: string | null;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assigned_to: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  reporter?: Profile;
  category?: ComplaintCategory;
  house?: House;
  assignee?: Profile;
}

export interface ComplaintUpdate {
  id: string;
  complaint_id: string;
  author_id: string;
  status: string | null;
  body: string;
  created_at: string;
  author?: Profile;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// Deprecated multi-community types for transition:
export interface Community {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  image_url?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
}

// ==========================================
// V3 UPGRADE FEATURES
// ==========================================

export type ExpenseCategory =
  | 'security'
  | 'waste'
  | 'maintenance'
  | 'utilities'
  | 'administration'
  | 'social'
  | 'other';

export interface Expense {
  id: string;
  rw_id: string | null;
  rt_id: string | null;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  description: string | null;
  proof_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  rt?: RtUnit;
  rw?: RwUnit;
}

export type HouseClaimOccupancy = 'owner' | 'renter' | 'family';
export type HouseClaimStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface HouseClaim {
  id: string;
  user_id: string;
  house_id: string;
  occupancy_status: HouseClaimOccupancy;
  document_url: string | null;
  notes: string | null;
  status: HouseClaimStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  user?: Profile;
  house?: House;
  reviewer?: Profile;
}

export type EmergencyType = 'general' | 'security' | 'medical' | 'fire';
export type EmergencyStatus = 'active' | 'acknowledged' | 'resolved' | 'cancelled';

export interface EmergencyEvent {
  id: string;
  user_id: string;
  house_id: string | null;
  rt_id: string | null;
  rw_id: string | null;
  emergency_type: EmergencyType;
  status: EmergencyStatus;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  user?: Profile;
  house?: House;
}

export type VisitorPassStatus = 'expected' | 'checked_in' | 'checked_out' | 'cancelled' | 'expired';

export interface VisitorPass {
  id: string;
  host_user_id: string;
  house_id: string;
  guest_name: string;
  guest_phone: string | null;
  vehicle_plate: string | null;
  visit_date: string;
  expected_departure: string | null;
  purpose: string;
  access_code: string;
  status: VisitorPassStatus;
  checked_in_at: string | null;
  checked_out_at: string | null;
  checked_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  host?: Profile;
  house?: House;
}

