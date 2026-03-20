import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { createUserWithWallet } from '../../models/Users.js';
import { query } from '../../db/connection.js';

export const createUser = async (req: Request, res: Response): Promise<void> => {
	const normalizedName = (req.body.name as string).trim().toLowerCase();

	try {
		const user = await createUserWithWallet(normalizedName);
		const token = jwt.sign(
			{ user_id: user.user_id, wallet_id: user.wallet_id },
			process.env.JWT_SECRET as string,
			{ expiresIn: '24h' },
		);

		res.status(201).json({
			message: 'User created successfully',
			data: {
				...user,
				token,
			},
		});
	} catch (error: any) {
		if (error.code === '23505') {
			try {
				const result = await query('SELECT user_id, name FROM users WHERE LOWER(name) = LOWER($1)', [
					normalizedName,
				]);
				const user = result.rows[0];
				if (!user) {
					res.status(409).json({ error: 'A user with this name exists, but could not be retrieved.' });
					return;
				}

				const walletRes = await query('SELECT wallet_id FROM wallets WHERE user_id = $1', [
					user.user_id,
				]);
				const wallet = walletRes.rows[0];

				if (!wallet) {
					res.status(500).json({ error: 'User profile found, but wallet is missing.' });
					return;
				}

				const token = jwt.sign(
					{ user_id: user.user_id, wallet_id: wallet.wallet_id },
					process.env.JWT_SECRET as string,
					{ expiresIn: '24h' },
				);

				res.status(200).json({
					message: 'Welcome back! User logged in successfully.',
					data: { ...user, wallet_id: wallet.wallet_id, token },
				});
				return;
			} catch (innerError) {
				res.status(500).json({ message: 'Internal Server Error during login' });
				return;
			}
		}

		console.error('Error creating user:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
};

export const findUserByName = async (req: Request, res: Response): Promise<void> => {
	const normalizedName = (req.query.name as string).trim().toLowerCase();

	try {
		const result = await query('SELECT user_id, name FROM users WHERE name ILIKE $1', [
			normalizedName,
		]);

		if (result.rowCount === 0) {
			res.status(404).json({ message: 'User not found.' });
			return;
		}

		res.status(200).json({ data: result.rows[0] });
	} catch (error) {
		res.status(500).json({ message: 'Internal Server Error' });
	}
};
