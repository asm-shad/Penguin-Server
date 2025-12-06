export default {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  
  // Add backend_url
  backend_url: process.env.BACKEND_URL || 'http://localhost:5000',
  
  cloudinary: {
    api_secret: process.env.CLOUDINARY_API_SECRET,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
  },
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY,
    publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  
  ssl: {
    storeId: process.env.SSL_STORE_ID,
    storePass: process.env.SSL_STORE_PASS,
    sslPaymentApi: process.env.SSL_PAYMENT_API,
    sslValidationApi: process.env.SSL_VALIDATION_API,
    successUrl: process.env.SSL_SUCCESS_URL,
    failUrl: process.env.SSL_FAIL_URL,
    cancelUrl: process.env.SSL_CANCEL_URL,
  },
  
  frontend: {
    base_url: process.env.FRONTEND_BASE_URL,
    success_url: `${process.env.FRONTEND_BASE_URL}/checkout/success`,
    cancel_url: `${process.env.FRONTEND_BASE_URL}/checkout/cancel`,
  },
  
  emailSender: {
    email: process.env.EMAIL,
    app_pass: process.env.APP_PASS,
  },
  
  jwt: {
    jwt_secret: process.env.JWT_SECRET,
    expires_in: process.env.EXPIRES_IN,
    refresh_token_secret: process.env.REFRESH_TOKEN_SECRET,
    refresh_token_expires_in: process.env.REFRESH_TOKEN_EXPIRES_IN,
    reset_pass_secret: process.env.RESET_PASS_TOKEN,
    reset_pass_token_expires_in: process.env.RESET_PASS_TOKEN_EXPIRES_IN,
  },
  
  salt_round: process.env.SALT_ROUND,
  reset_pass_link: process.env.RESET_PASS_LINK,
};