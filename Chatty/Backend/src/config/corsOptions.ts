import { isAllowedOrigin } from './allowedOrigins';

const corsOptions = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

export default corsOptions;
