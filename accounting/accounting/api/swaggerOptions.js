// swaggerOptions.js
export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Accounting API',
      version: '1.0.0',
      description: 'API documentation for your accounting app',
    },
    servers: [
      {
        url: 'http://localhost:5000',
      },
    ],
  },
  apis: ['./routes/*.js'], // مسیر دقیق فایل‌هایی که کامنت‌های Swagger داخلشونه
};
