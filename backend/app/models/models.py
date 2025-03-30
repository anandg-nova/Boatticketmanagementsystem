from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    RIDE_MANAGER = "ride_manager"
    CUSTOMER = "customer"

class User(Base):
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(Enum(UserRole))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    bookings = relationship("Booking", back_populates="customer")
    managed_rides = relationship("Ride", back_populates="ride_manager")

class Pier(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    location = Column(String)
    description = Column(String)
    
    # Relationships
    boats = relationship("Boat", back_populates="pier")

class Boat(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    capacity = Column(Integer)
    pier_id = Column(Integer, ForeignKey("pier.id"))
    description = Column(String)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    pier = relationship("Pier", back_populates="boats")
    rides = relationship("Ride", back_populates="boat")

class Timeslot(Base):
    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    max_capacity = Column(Integer)
    boat_id = Column(Integer, ForeignKey("boat.id"))
    
    # Relationships
    rides = relationship("Ride", back_populates="timeslot")

class Ride(Base):
    id = Column(Integer, primary_key=True, index=True)
    boat_id = Column(Integer, ForeignKey("boat.id"))
    timeslot_id = Column(Integer, ForeignKey("timeslot.id"))
    ride_manager_id = Column(Integer, ForeignKey("user.id"))
    departure_time = Column(DateTime)
    return_time = Column(DateTime)
    status = Column(String)  # scheduled, in_progress, completed, cancelled
    
    # Relationships
    boat = relationship("Boat", back_populates="rides")
    timeslot = relationship("Timeslot", back_populates="rides")
    ride_manager = relationship("User", back_populates="managed_rides")
    bookings = relationship("Booking", back_populates="ride")

class Booking(Base):
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("user.id"))
    ride_id = Column(Integer, ForeignKey("ride.id"))
    number_of_tickets = Column(Integer)
    total_amount = Column(Float)
    payment_status = Column(String)  # pending, completed, refunded
    booking_status = Column(String)  # confirmed, cancelled
    qr_code_path = Column(String)
    
    # Relationships
    customer = relationship("User", back_populates="bookings")
    ride = relationship("Ride", back_populates="bookings") 