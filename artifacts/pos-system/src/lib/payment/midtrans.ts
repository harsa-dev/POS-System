const midtransClient = require("midtrans-client");

export const snap = new midtransClient.Snap({
  isProduction: process.env.NODE_ENV === "production",

  serverKey: process.env.MIDTRANS_SERVER_KEY,

  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});