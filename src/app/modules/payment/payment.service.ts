import {
  PaymentStatus,
  PaymentMethod,
  PaymentGateway,
  OrderStatus,
} from "@prisma/client";
import { IAuthUser } from "../../interfaces/common";
import prisma from "../../shared/prisma";
import Stripe from "stripe";
import { SSLService } from "../SSL/ssl.service";
import { stripe } from "../../helper/stripe";
import config from "../../../config";
import { stripeToPlainObject } from "../../helper/stripeToPlainObject";

// Helper function
const createOrderTrackingRecord = async (
  orderId: string,
  status: OrderStatus,
  notes: string,
  userId?: string
) => {
  return await prisma.orderTracking.create({
    data: { orderId, status, notes, userId },
  });
};

// Create payment (admin)
const createPayment = async (
  orderId: string,
  paymentData: any,
  user: IAuthUser
) => {
  const {
    paymentMethod,
    paymentGateway,
    amount,
    transactionId,
    gatewayResponse,
  } = paymentData;

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
  });

  // Validate payment amount
  if (amount > order.totalPrice) {
    throw new Error("Payment amount cannot exceed order total");
  }

  const result = await prisma.payment.create({
    data: {
      orderId,
      userId: user.id,
      paymentMethod: paymentMethod as PaymentMethod,
      paymentGateway: paymentGateway as PaymentGateway,
      amount,
      transactionId,
      gatewayResponse,
      paymentStatus: "PENDING",
      currency: order.currency || "USD",
    },
  });

  return result;
};

// Initialize Payment (Choose gateway based on request or config)
const initPayment = async (
  orderId: string,
  gateway: PaymentGateway = "STRIPE",
  successUrl?: string,
  cancelUrl?: string
) => {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      user: true,
      orderItems: {
        include: {
          product: {
            include: {
              productImages: true,
            },
          },
          variant: true,
        },
      },
    },
  });

  // Check if payment already exists
  let payment = await prisma.payment.findFirst({
    where: {
      orderId,
      paymentStatus: { in: ["PENDING", "PROCESSING"] },
    },
  });

  // Create payment if doesn't exist
  if (!payment) {
    payment = await prisma.payment.create({
      data: {
        orderId,
        userId: order.userId,
        paymentMethod: gateway === "STRIPE" ? "CREDIT_CARD" : "BANK_TRANSFER",
        paymentGateway: gateway,
        amount: order.totalPrice,
        currency: order.currency || "USD",
        paymentStatus: "PENDING",
      },
    });
  }

  let result: any;

  if (gateway === "STRIPE") {
    // Stripe payment flow
    const lineItems = order.orderItems.map((item) => {
      // Get primary image URL
      const primaryImage = item.product.productImages.find(
        (img: any) => img.isPrimary
      );
      const imageUrls = primaryImage ? [primaryImage.imageUrl] : [];

      return {
        price_data: {
          currency: order.currency.toLowerCase() || "usd",
          product_data: {
            name: item.productName,
            description: item.variantInfo || `SKU: ${item.product.sku || "N/A"}`,
            images: imageUrls,
          },
          unit_amount: Math.round(item.unitPrice * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    // Ensure URLs have protocol
    const getValidUrl = (url: string | undefined, defaultUrl: string): string => {
      if (!url) return defaultUrl;
      
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      
      return url;
    };

    // Default success and cancel URLs
    const defaultSuccessUrl = `${config.frontend.base_url}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`;
    const defaultCancelUrl = `${config.frontend.base_url}/checkout/cancel?order_id=${orderId}`;
    
    const validSuccessUrl = getValidUrl(successUrl, defaultSuccessUrl);
    const validCancelUrl = getValidUrl(cancelUrl, defaultCancelUrl);

    console.log('Stripe URLs:', { validSuccessUrl, validCancelUrl }); // Debug log

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: validSuccessUrl,
      cancel_url: validCancelUrl,
      client_reference_id: orderId,
      metadata: {
        orderId,
        paymentId: payment.id,
        userId: order.userId,
      },
      customer_email: order.customerEmail,
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "IN", "BD"],
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripeCheckoutSessionId: session.id,
      },
    });

    result = {
      gateway: "STRIPE",
      sessionId: session.id,
      paymentId: payment.id,
      url: session.url,
    };
  } else if (gateway === "PAYPAL") {
    // PayPal integration (to be implemented)
    throw new Error("PayPal integration not yet implemented");
  } else if (gateway === "CASH_ON_DELIVERY") {
    // COD flow
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paymentStatus: "PENDING",
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PROCESSING" },
    });

    result = {
      gateway: "CASH_ON_DELIVERY",
      paymentId: payment.id,
      message: "Order placed successfully. Pay on delivery.",
    };
  } else if (gateway === "RAZORPAY") {
    // Razorpay integration (to be implemented)
    throw new Error("Razorpay integration not yet implemented");
  }

  return result;
};

// Initialize SSL Payment
const initSSLPayment = async (orderId: string) => {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      user: true,
    },
  });

  // Use shipping address from order (denormalized in your schema)
  const shippingAddress = order.shippingAddress
    ? `${order.shippingAddress}, ${order.shippingCity || ''}, ${order.shippingState || ''}, ${order.shippingZipCode || ''}`
    : null;

  const paymentData = {
    amount: order.totalPrice,
    transactionId: `TXN-${order.orderNumber}-${Date.now()}`,
    name: order.customerName,
    email: order.customerEmail,
    address: shippingAddress,
    phoneNumber: order.user.phone || null,
  };

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      orderId,
      userId: order.userId,
      paymentMethod: "BANK_TRANSFER",
      paymentGateway: "RAZORPAY", // Or create SSL_GATEWAY enum
      amount: order.totalPrice,
      transactionId: paymentData.transactionId,
      currency: order.currency || "USD",
      paymentStatus: "PENDING",
    },
  });

  // Initiate SSL payment
  const sslResult = await SSLService.initPayment(paymentData);

  return {
    gateway: "SSLCOMMERZ",
    paymentId: payment.id,
    url: sslResult.GatewayPageURL,
    transactionId: paymentData.transactionId,
  };
};

// Handle SSL IPN
const handleSSLIPN = async (payload: any) => {
  // Validate payment with SSL
  const validationResult = await SSLService.validatePayment(payload);

  if (validationResult.status !== "VALID") {
    throw new Error("Invalid payment!");
  }

  await prisma.$transaction(async (tx) => {
    // Find payment by transaction ID
    const payment = await tx.payment.findFirst({
      where: {
        transactionId: payload.tran_id,
      },
    });

    if (!payment) {
      throw new Error("Payment not found!");
    }

    // Convert Stripe Session to plain object for JSON storage
    const gatewayResponse = {
      ...validationResult,
      val_id: validationResult.val_id,
      tran_id: validationResult.tran_id,
      amount: validationResult.amount,
      status: validationResult.status,
      bank_tran_id: validationResult.bank_tran_id,
      card_type: validationResult.card_type,
      card_no: validationResult.card_no,
      store_amount: validationResult.store_amount,
      currency: validationResult.currency,
      tran_date: validationResult.tran_date,
    };

    // Update payment
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        paymentStatus: "COMPLETED",
        gatewayResponse,
        paidAt: new Date(),
      },
    });

    // Update order
    await tx.order.update({
      where: { id: payment.orderId },
      data: { status: "PAID" },
    });

    // Deduct inventory
    const orderItems = await tx.orderItem.findMany({
      where: { orderId: payment.orderId },
      include: {
        product: true,
        variant: true,
      },
    });

    for (const item of orderItems) {
      const currentStock = item.variant
        ? item.variant.stock
        : item.product.stock;

      await tx.productInventory.create({
        data: {
          productId: item.productId,
          variantId: item.variantId,
          changeType: "STOCK_OUT",
          previousStock: currentStock,
          newStock: currentStock - item.quantity,
          changeQuantity: -item.quantity,
          reason: "Order placement via SSL",
          referenceId: payment.orderId,
          notes: `Order #${payment.orderId} - SSL payment completed`,
        },
      });

      // Update stock
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    // Create tracking record
    await createOrderTrackingRecord(
      payment.orderId,
      "PAID",
      "Payment completed via SSLCommerz"
    );

    // Create invoice
    await tx.invoice.create({
      data: {
        orderId: payment.orderId,
        invoiceNumber: `INV-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        hostedInvoiceUrl: validationResult.redirect_url || null,
      },
    });
  });

  return {
    message: "Payment validated and processed successfully!",
    status: validationResult.status,
  };
};

// Handle Stripe Webhook Events
const handleStripeWebhookEvent = async (event: Stripe.Event) => {
  let result = { processed: false, type: event.type };

  console.log('=== Webhook Event Debug ===');
  console.log('Event type:', event.type);
  console.log('Event ID:', event.id);
  console.log('Event data:', JSON.stringify(event.data, null, 2));

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('=== Session Details ===');
      console.log('Session ID:', session.id);
      console.log('Payment status:', session.payment_status);
      console.log('Session metadata:', session.metadata);
      console.log('Amount total:', session.amount_total);
      console.log('Currency:', session.currency);

      if (session.payment_status === "paid") {
        console.log('✅ Session is paid, processing...');
        
        await prisma.$transaction(async (tx) => {
          // Find payment by session metadata
          console.log('Looking for payment with session ID:', session.id);
          
          const payment = await tx.payment.findFirst({
            where: {
              order: {
                stripeCheckoutSessionId: session.id,
              },
            },
            include: {
              order: true,
            },
          });

          console.log('Payment found:', payment ? 'Yes' : 'No');
          if (payment) {
            console.log('Payment ID:', payment.id);
            console.log('Order ID:', payment.orderId);
            console.log('Current payment status:', payment.paymentStatus);
            
            // Convert Stripe Session to plain object for JSON storage
            const gatewayResponse = stripeToPlainObject(session);

            // Update payment status
            console.log('Updating payment status to COMPLETED...');
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                paymentStatus: "COMPLETED",
                transactionId: typeof session.payment_intent === 'string' 
                  ? session.payment_intent 
                  : session.payment_intent?.id || null,
                gatewayResponse,
                paidAt: new Date(),
              },
            });

            // Update order status
            console.log('Updating order status to PAID...');
            await tx.order.update({
              where: { id: payment.orderId },
              data: { status: "PAID" },
            });

            // Deduct inventory
            console.log('Deducting inventory...');
            const orderItems = await tx.orderItem.findMany({
              where: { orderId: payment.orderId },
              include: {
                product: true,
                variant: true,
              },
            });

            console.log('Number of order items:', orderItems.length);
            
            for (const item of orderItems) {
              console.log(`Processing item: ${item.productName}, Quantity: ${item.quantity}`);
              
              const currentStock = item.variant
                ? item.variant.stock
                : item.product.stock;

              console.log(`Current stock: ${currentStock}`);

              await tx.productInventory.create({
                data: {
                  productId: item.productId,
                  variantId: item.variantId,
                  changeType: "STOCK_OUT",
                  previousStock: currentStock,
                  newStock: currentStock - item.quantity,
                  changeQuantity: -item.quantity,
                  reason: "Order placement",
                  referenceId: payment.orderId,
                  notes: `Order #${payment.orderId} - Payment completed`,
                },
              });

              // Update product/variant stock
              if (item.variantId) {
                await tx.productVariant.update({
                  where: { id: item.variantId },
                  data: { stock: { decrement: item.quantity } },
                });
                console.log(`Updated variant ${item.variantId} stock`);
              } else {
                await tx.product.update({
                  where: { id: item.productId },
                  data: { stock: { decrement: item.quantity } },
                });
                console.log(`Updated product ${item.productId} stock`);
              }
            }

            // Create order tracking record
            console.log('Creating order tracking record...');
            await tx.orderTracking.create({
              data: {
                orderId: payment.orderId,
                status: "PAID",
                notes: "Payment completed via Stripe",
                userId: payment.userId,
              },
            });

            // Create invoice
            console.log('Creating invoice...');
            await tx.invoice.create({
              data: {
                orderId: payment.orderId,
                invoiceNumber: `INV-${Date.now()}-${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
                stripeInvoiceId: session.id,
                hostedInvoiceUrl: session.success_url || null,
              },
            });

            result.processed = true;
            console.log('✅ Transaction completed successfully!');
          } else {
            console.log('❌ Payment not found! Check if stripeCheckoutSessionId is set on order.');
            
            // Try to find by metadata
            console.log('Trying to find by metadata...');
            if (session.metadata?.orderId) {
              const order = await tx.order.findUnique({
                where: { id: session.metadata.orderId },
              });
              console.log('Order found by metadata:', order ? 'Yes' : 'No');
            }
          }
        });
      } else {
        console.log('❌ Session payment_status is not "paid". Status:', session.payment_status);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      console.log('⚠️ Payment failed event received');
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findFirst({
          where: {
            transactionId: paymentIntent.id,
          },
        });

        if (payment) {
          const gatewayResponse = stripeToPlainObject(paymentIntent);

          await tx.payment.update({
            where: { id: payment.id },
            data: {
              paymentStatus: "FAILED",
              failureReason: paymentIntent.last_payment_error?.message || "Payment failed",
              gatewayResponse,
            },
          });
        }
      });
      break;
    }

    case "charge.refunded": {
      console.log('⚠️ Refund event received');
      const charge = event.data.object as Stripe.Charge;
      
      await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findFirst({
          where: {
            transactionId: charge.payment_intent as string,
          },
        });

        if (payment) {
          const refundAmount = charge.amount_refunded / 100;
          
          const gatewayResponse = stripeToPlainObject(charge);

          await tx.payment.update({
            where: { id: payment.id },
            data: {
              refundedAmount: refundAmount,
              refundedAt: new Date(),
              paymentStatus: refundAmount >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED",
              gatewayResponse,
            },
          });

          if (refundAmount >= payment.amount) {
            await tx.order.update({
              where: { id: payment.orderId },
              data: { status: "REFUNDED" },
            });
          }
        }
      });
      break;
    }

    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  return result;
};

// Update payment status
const updatePaymentStatus = async (
  paymentId: string,
  statusData: {
    paymentStatus: PaymentStatus;
    transactionId?: string;
    failureReason?: string;
    gatewayResponse?: any;
    refundedAmount?: number;
  }
) => {
  const {
    paymentStatus,
    transactionId,
    failureReason,
    gatewayResponse,
    refundedAmount,
  } = statusData;

  const updateData: any = {
    paymentStatus,
    failureReason,
    gatewayResponse,
  };

  if (transactionId) {
    updateData.transactionId = transactionId;
  }

  if (paymentStatus === "COMPLETED") {
    updateData.paidAt = new Date();
  }

  // Handle refund
  if (refundedAmount !== undefined) {
    updateData.refundedAmount = refundedAmount;
    updateData.refundedAt = new Date();

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (payment && refundedAmount >= payment.amount) {
      updateData.paymentStatus = "REFUNDED";
    } else if (refundedAmount > 0) {
      updateData.paymentStatus = "PARTIALLY_REFUNDED";
    }
  }

  const result = await prisma.$transaction(async (transactionClient) => {
    // Update payment
    const updatedPayment = await transactionClient.payment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        order: true,
      },
    });

    // If payment completed, update order status to PAID
    if (paymentStatus === "COMPLETED") {
      await transactionClient.order.update({
        where: { id: updatedPayment.orderId },
        data: { status: "PAID" },
      });

      // Create tracking record
      await createOrderTrackingRecord(
        updatedPayment.orderId,
        "PAID",
        "Payment completed successfully"
      );

      // Auto-generate invoice
      await transactionClient.invoice.create({
        data: {
          orderId: updatedPayment.orderId,
          invoiceNumber: `INV-${
            updatedPayment.order.orderNumber
          }-${Date.now()}`,
          stripeInvoiceId: transactionId || null,
        },
      });
    }

    return updatedPayment;
  });

  return result;
};

// Initiate refund
const initiateRefund = async (
  paymentId: string,
  refundData: any,
  user: IAuthUser
) => {
  const { refundAmount, reason } = refundData;

  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: {
      order: true,
    },
  });

  // Validate refund amount
  if (refundAmount > payment.amount - (payment.refundedAmount || 0)) {
    throw new Error("Refund amount exceeds available amount");
  }

  // Validate payment status allows refund
  if (!["COMPLETED", "PARTIALLY_REFUNDED"].includes(payment.paymentStatus)) {
    throw new Error(
      `Refund not allowed for payment in ${payment.paymentStatus} status`
    );
  }

  const result = await prisma.$transaction(async (transactionClient) => {
    // Update payment with refund
    const updatedPayment = await transactionClient.payment.update({
      where: { id: paymentId },
      data: {
        refundedAmount: (payment.refundedAmount || 0) + refundAmount,
        refundedAt: new Date(),
        paymentStatus:
          refundAmount >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED",
      },
    });

    // Update order status if full refund
    if (refundAmount >= payment.amount) {
      await transactionClient.order.update({
        where: { id: payment.orderId },
        data: { status: "CANCELLED" },
      });

      // Restore product stock
      const orderItems = await transactionClient.orderItem.findMany({
        where: { orderId: payment.orderId },
      });

      for (const item of orderItems) {
        if (item.variantId) {
          await transactionClient.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        } else {
          await transactionClient.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      // Create order tracking record
      await createOrderTrackingRecord(
        payment.orderId,
        "CANCELLED",
        `Order cancelled due to refund: ${reason}`
      );
    }

    return updatedPayment;
  });

  return result;
};

export const paymentService = {
  createPayment,
  initPayment,
  initSSLPayment,
  handleSSLIPN,
  updatePaymentStatus,
  initiateRefund,
  handleStripeWebhookEvent,
};