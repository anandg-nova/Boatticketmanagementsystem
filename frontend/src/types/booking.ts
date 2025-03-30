export interface Booking {
  _id: string;
  userId: string;
  rideId: string;
  rideName: string;
  date: string;
  time: string;
  quantity: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
} 