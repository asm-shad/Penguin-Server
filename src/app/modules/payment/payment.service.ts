import {
  PaymentStatus,
  PaymentMethod,
  PaymentGateway,
  OrderStatus,
} from "@prisma/client";
import { IAuthUser } from "../../interfaces/common";
import prisma from "../../shared/prisma";

// Helper function
const createOrderTrackingRecord = async (
  orderId: string,
  status: OrderStatus,
  notes: string
) => {
  return await prisma.orderTracking.create({
    data: { orderId, status, notes },
  });
};

// Create payment for order
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

// Update payment status (for webhooks/callbacks)
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
  updatePaymentStatus,
  initiateRefund,
};
