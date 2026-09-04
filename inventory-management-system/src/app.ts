import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app: Application = express();

const allowedOrigins = [
  "https://inventory-management-system-mmanaxgk7-kavyas4726s-projects.vercel.app",
  "https://inventory-management-system-git-main-kavyas4726s-projects.vercel.app",
];

app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'inventory-management-system' });
});

app.use("/api/v1", routes);

app.use(notFoundHandler);
app.use(errorHandler);


export default app;