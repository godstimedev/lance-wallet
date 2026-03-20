import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '../../types/index.js';

export const validateCreateUser = (req: AuthRequest, res: Response, next: NextFunction): void => {
	const { name } = req.body;

	if (!name || typeof name !== 'string' || name.trim().length === 0) {
		res.status(422).json({ error: 'Name is required and must not be empty.' });
		return;
	}

	next();
};

export const validateFindUser = (req: AuthRequest, res: Response, next: NextFunction): void => {
	const { name } = req.query;

	if (!name || typeof name !== 'string') {
		res.status(422).json({ message: 'Please provide a name to search for.' });
		return;
	}

	next();
};

export const validateDeposit = (req: AuthRequest, res: Response, next: NextFunction): void => {
	const { user_id, amount } = req.body;
	const idempotencyKey = req.headers['idempotency-key'];

	if (!idempotencyKey || typeof idempotencyKey !== 'string') {
		res.status(400).json({ message: 'idempotency-key header is required.' });
		return;
	}

	req.idempotencyKey = idempotencyKey;

	// NOTE: user_id in the request body is only required by the assessment spec.
	// In a production system the user identity would be derived solely from the
	// verified JWT token (req.user), and this field would not exist in the body.
	if (!user_id || typeof user_id !== 'string') {
		res.status(422).json({ message: 'user_id is required.' });
		return;
	}

	if (!amount || typeof amount !== 'number' || amount <= 0) {
		res.status(422).json({ message: 'Invalid amount. Amount must be a positive number.' });
		return;
	}

	if (user_id !== req.user?.user_id) {
		res.status(403).json({ message: "Forbidden: You cannot deposit into another user's account." });
		return;
	}

	next();
};

export const validateTransfer = (req: AuthRequest, res: Response, next: NextFunction): void => {
	const { from_user_id, to_user_id, amount } = req.body;
	const idempotencyKey = req.headers['idempotency-key'];

	if (!idempotencyKey || typeof idempotencyKey !== 'string') {
		res.status(400).json({ message: 'idempotency-key header is required.' });
		return;
	}

	req.idempotencyKey = idempotencyKey;

	// NOTE: from_user_id in the request body is only required by the assessment spec.
	// In a production system the user identity would be derived solely from the
	// verified JWT token (req.user), and this field would not exist in the body.
	if (!from_user_id || !to_user_id) {
		res.status(422).json({ message: 'Sender and receiver IDs are required.' });
		return;
	}

	if (from_user_id !== req.user?.user_id) {
		res
			.status(403)
			.json({ message: "Forbidden: You cannot initiate a transfer from another user's account." });
		return;
	}

	if (from_user_id === to_user_id) {
		res.status(422).json({ message: 'You cannot transfer money to yourself.' });
		return;
	}

	if (!amount || typeof amount !== 'number' || amount <= 0) {
		res.status(422).json({ message: 'Invalid amount. Amount must be a positive number.' });
		return;
	}

	next();
};

export const validateGetBalance = (req: AuthRequest, res: Response, next: NextFunction): void => {
	const { user_id } = req.params;

	if (!req.user?.wallet_id) {
		res.status(401).json({ message: 'Unauthorized' });
		return;
	}

	if (user_id !== req.user?.user_id) {
		res
			.status(403)
			.json({ message: "Forbidden: You cannot get the balance of another user's account." });
		return;
	}

	next();
};

export const validateGetTransactions = (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
): void => {
	const { user_id } = req.params;

	if (!req.user?.user_id) {
		res.status(401).json({ error: 'Unauthorized' });
		return;
	}

	if (user_id !== req.user?.user_id) {
		res
			.status(403)
			.json({ error: "Forbidden: You cannot get the transactions of another user's account." });
		return;
	}

	next();
};
