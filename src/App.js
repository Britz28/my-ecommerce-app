// This file is the whole shop page. It shows products, a cart, and a way to ask PayNow for payment.

import { useMemo, useState, useEffect } from 'react';
import './App.css';

// Sends a checkout request to the backend PayNow route.
async function createPayNowPayment({ userId, items, reference, email, phone, method }) {
  const response = await fetch('https://my-ecommerce-app-nh34.onrender.com/api/paynow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, items, reference, email, phone, method }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayNow request failed: ${errorText}`);
  }

  return response.json();
}

// Authentication API calls
async function loginUser(email, password) {
  const response = await fetch('https://my-ecommerce-app-nh34.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const contentType = response.headers.get("content-type");
  if (!contentType || contentType.indexOf("application/json") === -1) {
    throw new Error('Server error: Did you restart the backend? Please kill your terminal running node server.js and start it again.');
  }

  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.user;
}

async function signupUser(email, password) {
  const response = await fetch('https://my-ecommerce-app-nh34.onrender.com/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const contentType = response.headers.get("content-type");
  if (!contentType || contentType.indexOf("application/json") === -1) {
    throw new Error('Server error: Did you restart the backend? Please kill your terminal running node server.js and start it again.');
  }

  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.user;
}

// Main app component for the storefront.
function App() {
  // Authentication State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ecommerce_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [products, setProducts] = useState([]); // products loaded from database
  const [loadingProducts, setLoadingProducts] = useState(true); // loading state for products
  const [cart, setCart] = useState([]); // items currently in the cart
  
  // Checkout State
  const [checkoutEmail, setCheckoutEmail] = useState(user ? user.email : ''); 
  const [phone, setPhone] = useState(''); 
  const [method, setMethod] = useState('ecocash'); 
  const [status, setStatus] = useState(''); 
  const [paymentResult, setPaymentResult] = useState(null); 
  const [showCartReview, setShowCartReview] = useState(false); 

  // Sync checkout email if user logs in later
  useEffect(() => {
    if (user && !checkoutEmail) {
      setCheckoutEmail(user.email);
    }
  }, [user, checkoutEmail]);

  // Fetch products from the database on initial load
  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch('https://my-ecommerce-app-nh34.onrender.com/api/products');
        const data = await response.json();
        if (data.success) {
          setProducts(data.products);
        } else {
          console.error("Error from API:", data.error);
        }
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProducts();
  }, []);

  // Auth Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      let loggedInUser;
      if (authMode === 'login') {
        loggedInUser = await loginUser(authEmail, authPassword);
      } else {
        loggedInUser = await signupUser(authEmail, authPassword);
      }
      setUser(loggedInUser);
      localStorage.setItem('ecommerce_user', JSON.stringify(loggedInUser));
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ecommerce_user');
    setCart([]);
    setShowCartReview(false);
  };

  // Reset state and return to shopping.
  const handleReset = () => {
    setCart([]);
    setStatus('');
    setPaymentResult(null);
    setShowCartReview(false);
  };

  // Go back to shopping from cart review.
  const handleBackToShopping = () => {
    setShowCartReview(false);
  };

  // Calculate the cart total whenever the cart changes.
  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const addToCart = (product) => { // Add a product to the cart or increase quantity.
    setCart((current) => {
      const exists = current.find((item) => item.id === (product.id || product._id));
      if (exists) {
        return current.map((item) =>
          item.id === (product.id || product._id)
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...current, { ...product, id: product.id || product._id, quantity: 1 }];
    });
    setShowCartReview(true); // Show cart review screen after adding to cart
  };

  // Remove a product from the cart completely.
  const removeFromCart = (productId) => {
    setCart((current) => current.filter((item) => item.id !== productId));
  };

  // Called when the user clicks the checkout button.
  const handleCheckout = async () => {
    if (!cart.length) {
      setStatus('Please add a product to your cart first.');
      return;
    }

    if (!checkoutEmail || !phone) {
      setStatus('Please enter your email and phone number.');
      return;
    }

    const reference = `ORDER-${Date.now()}`; // unique order reference
    setStatus('Creating PayNow payment...');
    setPaymentResult(null);

    try {
      const result = await createPayNowPayment({
        userId: user.id,
        items: cart,
        reference,
        email: checkoutEmail,
        phone,
        method,
      });
      setPaymentResult(result);
      setStatus('Payment Successful!');
      setCart([]); // Empty the cart on success!
    } catch (error) {
      setStatus(error.message);
    }
  };

  // Proceed to checkout from cart review.
  const handleProceedToCheckout = () => {
    if (!checkoutEmail || !phone) {
      setStatus('Please enter your email and phone number.');
      return;
    }
    handleCheckout();
  };

  // ---------------- RENDER AUTHENTICATION SCREEN ----------------
  if (!user) {
    return (
      <div className="App auth-container">
        <header className="App-header">
          <h1>Skye Cosmetics</h1>
          <p>Please log in to continue shopping.</p>
        </header>
        <main className="cart-review-container" style={{justifyContent: 'center'}}>
          <section className="login-review" style={{maxWidth: '400px', width: '100%'}}>
            <h2>{authMode === 'login' ? 'Log In' : 'Sign Up'}</h2>
            <form onSubmit={handleAuthSubmit} className="checkout-form">
              <label>
                Email
                <input 
                  type="email" 
                  value={authEmail} 
                  onChange={(e) => setAuthEmail(e.target.value)} 
                  required 
                />
              </label>
              <label>
                Password
                <input 
                  type="password" 
                  value={authPassword} 
                  onChange={(e) => setAuthPassword(e.target.value)} 
                  required 
                />
              </label>
              {authError && <p className="status-message" style={{color: 'red'}}>{authError}</p>}
              <button type="submit" className="checkout-button" style={{marginTop: '1rem'}}>
                {authMode === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            </form>
            <button 
              type="button" 
              className="back-button" 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              style={{ marginTop: '1rem', width: '100%' }}
            >
              {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </section>
        </main>
      </div>
    );
  }

  // ---------------- RENDER CART REVIEW SCREEN ----------------
  if (showCartReview && (cart.length > 0 || paymentResult)) {
    return (
      <div className="App">
        <header className="App-header">
          <div className="header-top">
            <h1>Skye Cosmetics</h1>
            <button type="button" className="logout-button" onClick={handleLogout}>
              Log Out ({user.email})
            </button>
          </div>
          <p>Review your cart and enter your details to proceed with checkout.</p>
        </header>

        <main className="cart-review-container">
          <section className="cart-review">
            <h2>Review Your Cart</h2>
            {paymentResult ? (
              <div className="success-message" style={{backgroundColor: '#e6fffa', padding: '2rem', borderRadius: '8px', border: '1px solid #38b2ac'}}>
                <h3 style={{color: '#2c7a7b'}}>🎉 Payment Completed!</h3>
                <p><strong>Status:</strong> {status}</p>
                <p><strong>Instructions:</strong> {paymentResult.instructions}</p>
                <p><strong>Order Ref:</strong> {paymentResult.paynowReference}</p>
                <button type="button" className="checkout-button" onClick={handleReset} style={{marginTop: '1rem'}}>
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
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
                <div className="order-summary">
                  <p>Total: <strong>${total.toFixed(2)}</strong></p>
                </div>
              </>
            )}
          </section>

          {!paymentResult && (
            <section className="login-review">
              <h2>Enter Your Details</h2>
              <div className="checkout-form">
                <label>
                  Email
                  <input
                    type="email"
                    value={checkoutEmail}
                    onChange={(event) => setCheckoutEmail(event.target.value)}
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
              </div>
              <div className="review-actions">
                <button type="button" className="back-button" onClick={handleBackToShopping}>
                  Back to Shopping
                </button>
                <button type="button" className="checkout-button" onClick={handleProceedToCheckout}>
                  Proceed to Checkout
                </button>
              </div>
              {status && <p className="status-message">{status}</p>}
            </section>
          )}
        </main>
      </div>
    );
  }

  // ---------------- RENDER STOREFRONT SCREEN ----------------
  return (
    <div className="App">
      <header className="App-header">
        <div className="header-top">
          <h1>Skye Cosmetics</h1>
          <button type="button" className="logout-button" onClick={handleLogout}>
            Log Out ({user.email})
          </button>
        </div>
        <p>Browse our collection of premium cosmetics.</p>
        <img
          className="hero-image"
          src="https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1200&q=80"
          alt="Makeup and beauty products arranged beautifully"
        />
      </header>

      <main className="storefront">
        <section className="products">
          <h2>Products</h2>
          <div className="product-grid">
            {loadingProducts ? (
              <p>Loading products from database...</p>
            ) : products.length === 0 ? (
              <p>No products available.</p>
            ) : (
              products.map((product) => (
                <article key={product.id || product._id} className="product-card">
                  <img src={product.image} alt={product.name} className="product-image" />
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <strong>${product.price.toFixed(2)}</strong>
                  <button type="button" onClick={() => addToCart(product)}>
                    Add to cart
                  </button>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="cart">
          <h2>Cart</h2>
          {cart.length === 0 ? (
            <p>Your cart is empty. Start shopping!</p>
          ) : (
            <>
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
              <div className="order-summary">
                <p>Total: <strong>${total.toFixed(2)}</strong></p>
              </div>
              <button type="button" className="checkout-button" onClick={() => setShowCartReview(true)}>
                Review & Checkout
              </button>
            </>
          )}
          {status && <p className="status-message">{status}</p>}
        </section>
      </main>

      <footer className="instructions">
        <h2>How to purchase</h2>
        <ol>
          <li>Browse and add cosmetics to your cart.</li>
          <li>Click <strong>Review & Checkout</strong> to review your cart.</li>
          <li>Enter your phone number on the details screen.</li>
          <li>Click <strong>Proceed to Checkout</strong>.</li>
          <li>
            The app sends your order to our backend PayNow route that
            processes your payment securely.
          </li>
          <li>Follow the PayNow mobile payment instructions.</li>
        </ol>
      </footer>
    </div>
  );
}

export default App;
