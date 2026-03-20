import type { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthRequest } from '../../types/index.js';

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const token = req.headers.authorization?.split(' ')[1];

		if (!token) {
			return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
		}

		const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as {
			user_id: string;
			wallet_id: string;
		};

		req.user = decodedToken;
		next();
	} catch (error) {
		return res.status(401).json({ error: 'Unauthorized: Invalid token' });
	}
};
