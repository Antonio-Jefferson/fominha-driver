export type DriverStatus = "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "REJECTED";

export interface DriverProfile {
  id_driver: string;
  enum_status: DriverStatus;
  tx_status_reason: string | null;
  tx_full_name: string;
  tx_phone: string;
  tx_vehicle_type: string | null;
  tx_vehicle_plate: string | null;
  tx_city: string;
  bool_online: boolean;
}

export interface DriverSignupInput {
  tx_full_name: string;
  tx_cpf: string;
  tx_phone: string;
  tx_vehicle_type?: string;
  tx_vehicle_plate?: string;
  tx_city: string;
}

export interface DriverUpdateInput {
  tx_full_name?: string;
  tx_phone?: string;
  tx_vehicle_type?: string;
  tx_vehicle_plate?: string;
  tx_pix_key?: string;
}

export type DeliveryOfferStatus =
  | "OFFERED"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELLED";

export interface DeliveryOffer {
  id_delivery_offer: string;
  id_order: string;
  id_establishment: string;
  id_driver: string;
  enum_status: DeliveryOfferStatus;
  int_payout_cents: number;
  dt_offered_at: string;
  dt_expires_at: string;
}

export type OrderStatus =
  | "PENDING"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "DELIVERY"
  | "COMPLETED"
  | "CANCELLED";

export interface DeliveryAddress {
  street: string | null;
  number: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
}

export interface ActiveDelivery {
  id_order: string;
  enum_status: OrderStatus;
  tx_customer_name: string;
  tx_customer_phone: string | null;
  int_total_cents: number;
  int_delivery_fee_cents: number;
  enum_payment_method: string;
  pickup: DeliveryAddress & { name: string };
  dropoff: DeliveryAddress & { complement: string | null };
}

export type WithdrawalStatus = "REQUESTED" | "APPROVED" | "PAID" | "REJECTED" | "CANCELLED";

export interface Withdrawal {
  id_withdrawal: string;
  int_amount_cents: number;
  enum_status: WithdrawalStatus;
  dt_requested_at: string;
}

export interface DriverBalance {
  available_cents: number;
  pending_cents: number;
  in_review_cents: number;
  recent_entries: Array<{
    id: string;
    type: string;
    amount_cents: number;
    status: string;
    order_id: string | null;
    occurred_at: string;
  }>;
}
