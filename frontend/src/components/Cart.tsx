import React from 'react';
import './Cart.css';

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface CartProps {
  items: CartItem[];
  onQuantityChange: (id: string, quantity: number) => void;
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({ items, onQuantityChange, onCheckout }) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <p>Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="cart">
      <div className="cart-header">
        <h3>Shopping Cart</h3>
        <span className="cart-count">{totalItems} items</span>
      </div>

      <div className="cart-items">
        {items.map(item => (
          <div key={item.id} className="cart-item">
            <div className="item-details">
              <h4>{item.name}</h4>
              <p className="item-price">${item.price.toFixed(2)}</p>
            </div>
            <div className="quantity-controls">
              <button
                onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                disabled={item.quantity <= 0}
              >
                -
              </button>
              <span className="quantity">{item.quantity}</span>
              <button
                onClick={() => onQuantityChange(item.id, item.quantity + 1)}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-footer">
        <div className="cart-total">
          <span>Total:</span>
          <span className="total-amount">${totalAmount.toFixed(2)}</span>
        </div>
        <button className="checkout-button" onClick={onCheckout}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart; 