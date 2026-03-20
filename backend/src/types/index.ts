import type { Request } from 'express';

export interface User {
	user_id: string;
	name: string;
	wallet_id: string;
	created_at: Date;
}

export interface AuthRequest extends Request {
	user?: {
		user_id: string;
		wallet_id: string;
	};
	idempotencyKey?: string;
}
