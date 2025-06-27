const express = require('express');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');

app.use(bodyParser.json());

const priceMap = {
  1: 1000,  // £10 in pence
  2: 1500   // £15 in pence
};

app.post('/create-checkout', async (req, res) => {
  const { votes, director } = req.body;

  if (!priceMap[votes]) {
    return res.status(400).json({ error: 'Invalid votes count' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `${votes} vote${votes > 1 ? 's' : ''} for ${director}`
          },
          unit_amount: priceMap[votes]
        },
        quantity: 1,
      }],
      metadata: {
        votes: votes.toString(),
        director: director
      },
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook endpoint placeholder (set up later)
app.post('/webhook', bodyParser.raw({type: 'application/json'}), (req, res) => {
  // Handle Stripe webhook here
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
