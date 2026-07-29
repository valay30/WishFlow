export const adminGuard = (req, res, next) => {
    if (req.method === 'OPTIONS') return next();
    const token = req.headers['x-admin-secret'];
    if (!token || token !== process.env.ADMIN_SECRET) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};
