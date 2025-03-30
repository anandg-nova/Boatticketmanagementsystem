import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { Paper, Typography, Box, Button, Card, CardContent, IconButton } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';

interface Timeslot {
  _id: string;
  startTime: string;
  endTime: string;
  availableCapacity: number;
  totalCapacity: number;
  price: number;
}

interface Ride {
  _id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
}

interface CartItem {
  rideId: string;
  rideName: string;
  quantity: number;
  price: number;
}

const LandingPage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeslot, setSelectedTimeslot] = useState<Timeslot | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Fetch timeslots for selected date
  const { data: timeslots, isLoading: isLoadingTimeslots } = useQuery({
    queryKey: ['timeslots', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await axios.get(`/api/v1/timeslots/date/${format(selectedDate, 'yyyy-MM-dd')}`);
      return response.data.data.timeslots;
    },
  });

  // Fetch available rides
  const { data: rides, isLoading: isLoadingRides } = useQuery({
    queryKey: ['rides'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/rides');
      return response.data.data.rides;
    },
  });

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeslot(null);
  };

  const handleTimeslotSelect = (timeslot: Timeslot) => {
    setSelectedTimeslot(timeslot);
  };

  const handleAddToCart = (ride: Ride) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.rideId === ride._id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.rideId === ride._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { rideId: ride._id, rideName: ride.name, quantity: 1, price: ride.price }];
    });
  };

  const handleRemoveFromCart = (rideId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.rideId === rideId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) =>
          item.rideId === rideId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prevCart.filter((item) => item.rideId !== rideId);
    });
  };

  const handleCheckout = () => {
    if (selectedTimeslot && cart.length > 0) {
      navigate('/checkout', {
        state: {
          timeslot: selectedTimeslot,
          cart,
        },
      });
    }
  };

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Typography variant="h4" component="h1" className="mb-8 text-center">
        Book Your Boat Ride
      </Typography>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Calendar Section */}
        <div className="md:col-span-1">
          <Paper className="p-4">
            <DateCalendar
              value={selectedDate}
              onChange={handleDateChange}
              disablePast
              sx={{ width: '100%' }}
            />
          </Paper>
        </div>

        {/* Timeslots Section */}
        <div className="md:col-span-2">
          <Paper className="p-4">
            <Typography variant="h6" className="mb-4">
              Available Timeslots for {format(selectedDate, 'MMMM d, yyyy')}
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoadingTimeslots ? (
                <Typography>Loading timeslots...</Typography>
              ) : (
                timeslots?.map((timeslot: Timeslot) => (
                  <Card
                    key={timeslot._id}
                    className={`cursor-pointer transition-all ${
                      selectedTimeslot?._id === timeslot._id
                        ? 'border-2 border-primary'
                        : ''
                    }`}
                    onClick={() => handleTimeslotSelect(timeslot)}
                  >
                    <CardContent>
                      <Typography variant="h6">
                        {format(new Date(timeslot.startTime), 'h:mm a')} -{' '}
                        {format(new Date(timeslot.endTime), 'h:mm a')}
                      </Typography>
                      <div className="flex items-center mt-2">
                        <div
                          className={`w-4 h-4 rounded-full mr-2 ${getAvailabilityColor(
                            timeslot.availableCapacity,
                            timeslot.totalCapacity
                          )}`}
                        />
                        <Typography variant="body2">
                          {timeslot.availableCapacity} / {timeslot.totalCapacity} seats available
                        </Typography>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </Paper>
        </div>

        {/* Rides Section */}
        {selectedTimeslot && (
          <div className="md:col-span-3">
            <Paper className="p-4">
              <Typography variant="h6" className="mb-4">
                Available Rides
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoadingRides ? (
                  <Typography>Loading rides...</Typography>
                ) : (
                  rides?.map((ride: Ride) => (
                    <Card key={ride._id}>
                      <CardContent>
                        <Typography variant="h6">{ride.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {ride.description}
                        </Typography>
                        <Typography variant="body2" className="mt-2">
                          Duration: {ride.duration} minutes
                        </Typography>
                        <Typography variant="h6" color="primary" className="mt-2">
                          ${ride.price}
                        </Typography>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center">
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveFromCart(ride._id)}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Typography className="mx-2">
                              {cart.find((item) => item.rideId === ride._id)?.quantity || 0}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleAddToCart(ride)}
                            >
                              <AddIcon />
                            </IconButton>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </Paper>
          </div>
        )}

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="md:col-span-3">
            <Paper className="p-4">
              <Typography variant="h6" className="mb-4">
                Cart Summary
              </Typography>
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.rideId} className="flex justify-between items-center">
                    <Typography>
                      {item.rideName} x {item.quantity}
                    </Typography>
                    <Typography>${item.price * item.quantity}</Typography>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <Typography variant="h6">Total</Typography>
                    <Typography variant="h6">
                      ${cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
                    </Typography>
                  </div>
                </div>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  className="mt-4"
                  onClick={handleCheckout}
                  disabled={!selectedTimeslot}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </Paper>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage; 