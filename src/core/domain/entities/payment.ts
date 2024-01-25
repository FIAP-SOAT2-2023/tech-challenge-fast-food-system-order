export interface Payment {
  qrCode: string;
  nsu: string;
  totalPrice: number;
  uuid: string;
  orderId: string;
  id?: number;
  checkoutUrl?: string;
}
