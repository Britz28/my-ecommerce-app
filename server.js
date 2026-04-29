// This is the tiny server file. It runs in Node and talks to PayNow.
// The comments are honest and easy to follow, even if you are not into code.

const express = require('express');
const bodyParser = require('body-parser');
const { Paynow } = require('paynow');

// Start the app that listens for requests.
const app = express();
app.use(bodyParser.json()); // make sure we can read the stuff the browser sends

// This is where you put your PayNow keys. If you don't, the payment will not work.
const paynow = new Paynow(
  process.env.PAYNOW_INTEGRATION_ID || 'YOUR_INTEGRATION_ID',
  process.env.PAYNOW_INTEGRATION_KEY || 'YOUR_INTEGRATION_KEY',
);

// PayNow needs to know where to send results and where to return the shopper.
paynow.resultUrl = process.env.PAYNOW_RESULT_URL || 'http://localhost:3000/paynow-result';
paynow.returnUrl = process.env.PAYNOW_RETURN_URL || 'http://localhost:3000/paynow-return';

// This is the route the browser hits when the shopper clicks the PayNow button.
app.post('/api/paynow', async (req, res) => {
  const { items, reference, email, phone, method } = req.body;

  // If the cart is empty, the server refuses to proceed.
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ success: false, error: 'Cart items are required' });
  }

  // If anything important is missing, we tell the browser to fix it.
  if (!reference || !email || !phone || !method) {
    return res.status(400).json({ success: false, error: 'Missing payment details' });
  }

  // Create a PayNow payment and add every product in the cart to it.
  const payment = paynow.createPayment(reference, email);
  items.forEach((item) => {
    payment.add(item.name, item.price);
  });

  try {
    // This is the key step: we ask PayNow to send mobile money instructions.
    const response = await paynow.sendMobile(payment, phone, method);

    if (!response.success) {
      return res.status(400).json({
        success: false,
        error: response.error || 'PayNow mobile payment could not be created',
      });
    }

    // If PayNow says yes, we send the instructions back to the browser.
    return res.json({
      success: true,
      instructions: response.instructions,
      pollUrl: response.pollUrl,
      status: response.status,
      paynowReference: response.paynowReference,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`PayNow backend running at http://localhost:${port}`);
});
