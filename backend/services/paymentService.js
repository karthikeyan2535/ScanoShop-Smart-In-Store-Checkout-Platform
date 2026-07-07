const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../config/prisma');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

const createRazorpayOrder = async (orderId, amount) => {
  const isMock = process.env.RAZORPAY_KEY_ID === 'dummy_key_id' || !process.env.RAZORPAY_KEY_ID;
  
  if (isMock) {
    const mockId = `order_${crypto.randomBytes(8).toString('hex')}`;
    await prisma.payment.create({
      data: {
        orderId,
        razorpayOrderId: mockId,
        amount: amount,
        status: 'PENDING',
      },
    });
    return { id: mockId, amount: Math.round(amount * 100), currency: 'INR' };
  }

  const options = {
    amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
    currency: 'INR',
    receipt: `rcpt_${orderId}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    
    // Create pending payment record
    await prisma.payment.create({
      data: {
        orderId,
        razorpayOrderId: order.id,
        amount: amount,
        status: 'PENDING',
      },
    });

    return order;
  } catch (error) {
    console.error('Razorpay create order error:', error);
    throw new Error('Failed to create Razorpay order');
  }
};

const verifyRazorpaySignature = async (razorpayOrderId, razorpayPaymentId, signature) => {
  const isMock = process.env.RAZORPAY_KEY_ID === 'dummy_key_id' || !process.env.RAZORPAY_KEY_ID;
  
  if (isMock && signature === 'mock_signature') {
    await prisma.payment.updateMany({
      where: { razorpayOrderId },
      data: {
        razorpayPaymentId,
        status: 'SUCCESS',
      },
    });
    return true;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');
    
  if (expectedSignature !== signature) {
    throw new Error('Invalid signature');
  }

  // Update payment record to SUCCESS
  await prisma.payment.updateMany({
    where: { razorpayOrderId },
    data: {
      razorpayPaymentId,
      status: 'SUCCESS',
    },
  });

  return true;
};

module.exports = { createRazorpayOrder, verifyRazorpaySignature };
