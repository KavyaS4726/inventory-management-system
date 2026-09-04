import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Inventory Management System API',
      version: '1.0.0',
      description: 'Backend API for internal inventory tracking — categories, suppliers, products, stock movements, and reporting.',
    },
    servers: [
      { url: 'http://localhost:5000/api/v1', description: 'Local dev server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.routes.ts'], // path to your route files with JSDoc comments
};

export const swaggerSpec = swaggerJsdoc(options);