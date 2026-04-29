// This file is the whole shop page. It shows products, a cart, and a way to ask PayNow for payment.
// The comments are loud and easy to read, because this whole thing is meant to be obvious.

import { useMemo, useState } from 'react';
import './App.css';

// These are the cosmetics we are selling. Nothing fancy, just three items.
const PRODUCTS = [
  {
    id: 1,
    name: 'Pure Glow Serum',
    description: 'Hydrating vitamin C serum for radiant skin.',
    price: 24.99,
  },
  {
    id: 2,
    name: 'Velvet Lipstick',
    description: 'Rich long-lasting shade with a satin finish.',
    price: 16.99,
  },
  {
    id: 3,
    name: 'Luxury Face Cream',
    description: 'Deep-moisture cream for all skin types.',
    price: 42.5,
  },
];

// This is the bit that asks the backend to make a PayNow payment happen.
async function createPayNowPayment({ items, reference, email, phone, method }) {
  const response = await fetch('/api/paynow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items, reference, email, phone, method }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayNow request failed: ${errorText}`);
  }

  return response.json();
}

// This is the main app component. It is what the browser renders.
function App() {
  // These are the things we remember while someone is shopping.
  const [cart, setCart] = useState([]); // what the customer has put in the basket
  const [email, setEmail] = useState(''); // email the customer typed in
  const [phone, setPhone] = useState(''); // phone number for PayNow
  const [method, setMethod] = useState('ecocash'); // which mobile money method
  const [status, setStatus] = useState(''); // little status message for the shopper
  const [paymentResult, setPaymentResult] = useState(null); // what PayNow sent back

  // This adds up all the prices so we can show the total.
  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  // Add a product to the cart. If the product is already there, just bump the count.
  const addToCart = (product) => {
    setCart((current) => {
      const exists = current.find((item) => item.id === product.id);
      if (exists) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
  };

  // Remove an item from the cart if the shopper changes their mind.
  const removeFromCart = (productId) => {
    setCart((current) => current.filter((item) => item.id !== productId));
  };

  // This is the main checkout button action. It checks the cart and then asks PayNow to start payment.
  const handleCheckout = async () => {
    if (!cart.length) {
      setStatus('Please add a product to your cart first.');
      return;
    }

    if (!email || !phone) {
      setStatus('Please enter your email and phone number.');
      return;
    }

    const reference = `ORDER-${Date.now()}`; // a unique label for this order
    setStatus('Creating PayNow payment...');
    setPaymentResult(null);

    try {
      const result = await createPayNowPayment({
        items: cart,
        reference,
        email,
        phone,
        method,
      });
      setPaymentResult(result);
      setStatus('Payment request sent. Follow the PayNow mobile instructions below.');
    } catch (error) {
      setStatus(error.message);
    }
  };

  // This JSX is the page structure: header, product list, cart, checkout form, and footer.
  return (
    <div className="App">
      <header className="App-header">
        <h1>Skye Cosmetics</h1>
        <p>Simple cosmetics storefront with PayNow mobile checkout.</p>
      </header>

      <main className="storefront">
        <section className="products">
          <h2>Products</h2>
          <div className="product-grid">
            {PRODUCTS.map((product) => (
              <article key={product.id} className="product-card">
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <strong>${product.price.toFixed(2)}</strong>
                <button type="button" onClick={() => addToCart(product)}>
                  Add to cart
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="cart">
          <h2>Cart</h2>
          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <div className="cart-list">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.quantity} × ${item.price.toFixed(2)}</span>
                  </div>
                  <button type="button" onClick={() => removeFromCart(item.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="order-summary">
            <p>Total: <strong>${total.toFixed(2)}</strong></p>
          </div>

          <div className="checkout-form">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label>
              Phone
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0777000000"
              />
            </label>
            <label>
              Mobile money method
              <select value={method} onChange={(event) => setMethod(event.target.value)}>
                <option value="ecocash">Ecocash</option>
                <option value="onemoney">OneMoney</option>
              </select>
            </label>
            <button type="button" className="checkout-button" onClick={handleCheckout}>
              Pay with PayNow
            </button>
          </div>

          {status && <p className="status-message">{status}</p>}

          {paymentResult && (
            <div className="payment-result">
              <h3>Payment details</h3>
              <pre>{JSON.stringify(paymentResult, null, 2)}</pre>
            </div>
          )}
        </section>
      </main>

      <footer className="instructions">
        <h2>How PayNow integration works</h2>
        <ol>
          <li>Add cosmetics to the cart.</li>
          <li>Enter your email, phone number, and select your mobile money provider.</li>
          <li>Click <strong>Pay with PayNow</strong>.</li>
          <li>
            The app sends the order to a backend route (<code>/api/paynow</code>) that
            follows the PayNow NodeJS quickstart.
          </li>
          <li>
            The backend creates a PayNow payment, adds each item with <code>payment.add(name, price)</code>,
            and calls <code>paynow.sendMobile(payment, phone, method)</code>.
          </li>
          <li>Show the mobile payment instructions returned by PayNow.</li>
        </ol>
      </footer>
    </div>
  );
}

export default App;
