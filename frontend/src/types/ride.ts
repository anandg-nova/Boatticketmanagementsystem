export interface Ride {
  _id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  capacity: number;
  schedule: {
    startTime: string;
    endTime: string;
    days: string[];
  };
  status: 'active' | 'inactive' | 'cancelled';
  createdAt: string;
  updatedAt: string;
} 