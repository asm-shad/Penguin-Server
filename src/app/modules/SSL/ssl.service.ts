import axios from "axios";
import httpStatus from "http-status";
import { IPaymentData } from "./ssl.interface";
import config from "../../../config";
import ApiError from "../../errors/ApiErrors";

const initPayment = async (paymentData: IPaymentData) => {
  try {
    // Parse address components safely
    const addressParts = paymentData.address?.split(',') || [];
    
    const data = {
      store_id: config.ssl.storeId,
      store_passwd: config.ssl.storePass,
      total_amount: paymentData.amount,
      currency: 'USD',
      tran_id: paymentData.transactionId,
      success_url: config.ssl.successUrl,
      fail_url: config.ssl.failUrl,
      cancel_url: config.ssl.cancelUrl,
      ipn_url: `${config.backend_url}/api/payments/ipn`,
      shipping_method: 'N/A',
      product_name: 'E-commerce Order',
      product_category: 'General',
      product_profile: 'general',
      cus_name: paymentData.name,
      cus_email: paymentData.email,
      cus_add1: paymentData.address || 'N/A',
      cus_add2: 'N/A',
      cus_city: addressParts[0]?.trim() || 'City',
      cus_state: addressParts[1]?.trim() || 'State',
      cus_postcode: addressParts[2]?.trim() || '1000',
      cus_country: addressParts[3]?.trim() || 'US',
      cus_phone: paymentData.phoneNumber || 'N/A',
      cus_fax: 'N/A',
      ship_name: paymentData.name,
      ship_add1: paymentData.address || 'N/A',
      ship_add2: 'N/A',
      ship_city: addressParts[0]?.trim() || 'City',
      ship_state: addressParts[1]?.trim() || 'State',
      ship_postcode: addressParts[2]?.trim() || '1000',
      ship_country: addressParts[3]?.trim() || 'US',
    };

    const response = await axios({
      method: 'post',
      url: config.ssl.sslPaymentApi,
      data: data,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response.data;
  } catch (err) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment error occurred!");
  }
};

const validatePayment = async (payload: any) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `${config.ssl.sslValidationApi}?val_id=${payload.val_id}&store_id=${config.ssl.storeId}&store_passwd=${config.ssl.storePass}&format=json`
    });

    return response.data;
  } catch (err) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment validation failed!");
  }
};

export const SSLService = {
  initPayment,
  validatePayment
};