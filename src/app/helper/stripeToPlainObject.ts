/**
 * Convert Stripe objects to plain JSON-serializable objects for Prisma
 */
export const stripeToPlainObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }

  // Handle dates
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle Stripe-specific objects
  if (typeof obj === 'object') {
    // Check if it's a Stripe resource (has id and object properties)
    if (obj.id && typeof obj.id === 'string') {
      // Create a plain object with only serializable properties
      const result: Record<string, any> = {
        id: obj.id,
        object: obj.object || 'unknown',
      };

      // Add other common Stripe properties
      if (obj.created) {
        result.created = obj.created;
      }
      if (obj.livemode !== undefined) {
        result.livemode = obj.livemode;
      }
      if (obj.status) {
        result.status = obj.status;
      }
      if (obj.amount !== undefined) {
        result.amount = obj.amount;
      }
      if (obj.amount_total !== undefined) {
        result.amount_total = obj.amount_total;
      }
      if (obj.currency) {
        result.currency = obj.currency;
      }
      if (obj.payment_status) {
        result.payment_status = obj.payment_status;
      }
      if (obj.metadata) {
        result.metadata = stripeToPlainObject(obj.metadata);
      }
      if (obj.customer_email) {
        result.customer_email = obj.customer_email;
      }

      return result;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(stripeToPlainObject);
    }

    // Handle plain objects
    const result: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Skip functions and symbols
        if (typeof obj[key] !== 'function' && typeof obj[key] !== 'symbol') {
          result[key] = stripeToPlainObject(obj[key]);
        }
      }
    }
    return result;
  }

  // Return primitives as-is
  return obj;
};