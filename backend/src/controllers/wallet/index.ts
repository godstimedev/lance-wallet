import type { Response } from 'express';
import type { AuthRequest } from '../../types/index.js';
import {
	depositFunds,
	getTransactionHistory,
	getWalletBalance,
	transferFunds,
} from '../../models/Transactions.js';

export const deposit = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { amount } = req.body;

		const transaction = await depositFunds(req.user!.wallet_id, amount, req.idempotencyKey!);

		res.status(201).json({
			message: 'Deposit successful',
			data: transaction,
		});
	} catch (error: any) {
		if (error.code === '23505') {
			res.status(409).json({ message: 'A transaction with this reference ID already exists' });
			return;
		}

		res.status(500).json({ message: 'Internal server error' });
	}
};

export const transfer = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { from_user_id, to_user_id, amount } = req.body;

		const transaction = await transferFunds(from_user_id, to_user_id, amount, req.idempotencyKey!);

		res.status(200).json({
			message: 'Transfer successful',
			data: transaction,
		});
	} catch (error: any) {
		if (error.name === 'INSUFFICIENT_FUNDS') {
			res.status(400).json({ message: error.message });
			return;
		}

		if (error.code === '23505') {
			res.status(409).json({
				message: 'A transaction with this reference ID already exists',
			});
			return;
		}

		if (error.message === 'Receiver wallet not found') {
			res.status(404).json({ message: 'The receiving user does not exist.' });
			return;
		}

		res.status(500).json({ message: 'Internal Server Error' });
	}
};

export const getBalance = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { user_id } = req.params;

		const balance = await getWalletBalance(req.user!.wallet_id);

		res.status(200).json({
			message: 'Balance retrieved successfully',
			data: { user_id, balance },
		});
	} catch (error) {
		res.status(500).json({ message: 'Internal server error' });
	}
};

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { user_id } = req.params;

		const transactions = await getTransactionHistory(req.user!.wallet_id);

		res.status(200).json({
			message: 'Transactions retrieved successfully',
			data: { user_id, transactions },
		});
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
};
