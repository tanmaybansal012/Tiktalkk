const allowedOrigins = [
    'http://localhost:5173',
    'https://127.0.0.1:5173',
    'https://tiktalkk.netlify.app',
];

export const isAllowedOrigin = (origin?: string) => {
    if (!origin) return true;

    const configuredOrigins = (process.env.FRONTEND_URL || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

    return allowedOrigins.includes(origin) ||
        configuredOrigins.includes(origin) ||
        /^https:\/\/(?:[a-z0-9-]+\.)*vercel\.app$/i.test(origin);
};

export default allowedOrigins;
