import { Request, Response } from "express";
import { paymentService } from "./payment.service";
import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";
import sendResponse from "../../shared/sendResponse";
import catchAsync from "../../shared/catchAsync";
import stripe from "../../helper/stripe";

// Create payment (admin only)
const createPayment = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { orderId } = req.params;
    const user = req.user;
    const result = await paymentService.createPayment(
      orderId,
      req.body,
      user as IAuthUser
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Payment created successfully!",
      data: result,
    });
  }
);

// Initiate payment (public)
const initPayment = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { gateway, successUrl, cancelUrl } = req.body;
  
  const result = await paymentService.initPayment(
    orderId,
    gateway,
    successUrl,
    cancelUrl
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment initiated successfully!",
    data: result,
  });
});

// Initiate SSL payment
const initSSLPayment = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  
  const result = await paymentService.initSSLPayment(orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SSL payment initiated successfully!",
    data: result,
  });
});

// Handle SSL IPN
const handleSSLIPN = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.handleSSLIPN(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "IPN processed successfully!",
    data: result,
  });
});

// Update payment status
const updatePaymentStatus = catchAsync(async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const result = await paymentService.updatePaymentStatus(paymentId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment status updated successfully!",
    data: result,
  });
});

// Initiate refund
const initiateRefund = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { paymentId } = req.params;
    const user = req.user;
    const result = await paymentService.initiateRefund(
      paymentId,
      req.body,
      user as IAuthUser
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Refund initiated successfully!",
      data: result,
    });
  }
);

// Handle Stripe webhook - SIMPLIFIED VERSION
const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
  console.log('=== Webhook Received ===');
  console.log('Request body:', req.body);
  console.log('Body type:', typeof req.body);
  console.log('Is buffer?', Buffer.isBuffer(req.body));
  
  // Parse the body based on its type
  let eventData;
  
  if (Buffer.isBuffer(req.body)) {
    // Body is Buffer (from express.raw())
    console.log('Parsing Buffer to string...');
    const bodyString = req.body.toString();
    console.log('Body string:', bodyString);
    
    try {
      eventData = JSON.parse(bodyString);
    } catch (error) {
      console.error('Failed to parse JSON from Buffer:', error);
      return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
  } else if (typeof req.body === 'string') {
    // Body is string
    console.log('Parsing string to JSON...');
    try {
      eventData = JSON.parse(req.body);
    } catch (error) {
      console.error('Failed to parse JSON from string:', error);
      return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
  } else if (typeof req.body === 'object') {
    // Body is already parsed object
    console.log('Body is already object');
    eventData = req.body;
  } else {
    console.error('Unknown body type:', typeof req.body);
    return res.status(400).json({ error: 'Invalid request body type' });
  }
  
  console.log('Parsed event data:', JSON.stringify(eventData, null, 2));
  
  // Check if event data has required fields
  if (!eventData || !eventData.type) {
    console.error('Missing event type in data:', eventData);
    return res.status(400).json({ error: 'Missing event type' });
  }
  
  // Create a proper Stripe Event object
  const event = {
    id: eventData.id || `evt_test_${Date.now()}`,
    object: 'event',
    api_version: eventData.api_version || '2025-01-27.acacia',
    created: eventData.created || Math.floor(Date.now() / 1000),
    data: eventData.data || { object: eventData.object || {} },
    type: eventData.type,
    livemode: false,
    pending_webhooks: 0,
    request: null,
  };
  
  console.log('Created event object:', JSON.stringify(event, null, 2));
  
  try {
    const result = await paymentService.handleStripeWebhookEvent(event as any);
    console.log('Service result:', result);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in handleStripeWebhookEvent:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

export const paymentController = {
  createPayment,
  initPayment,
  initSSLPayment,
  handleSSLIPN,
  updatePaymentStatus,
  initiateRefund,
  handleStripeWebhook,
};