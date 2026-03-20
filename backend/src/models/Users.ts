import { withTransaction } from '../db/connection.js';
import type { User } from '../types/index.js';

export const createUserWithWallet = async (name: string): Promise<User> => {
	const userSql = `INSERT INTO users (name) VALUES ($1) RETURNING user_id,name,created_at`;
	const walletSql = `INSERT INTO wallets (user_id) VALUES ($1) RETURNING wallet_id`;

	return await withTransaction<User>(async (client) => {
		const userResult = await client.query(userSql, [name]);

		const newUser = userResult.rows[0];

		const walletResult = await client.query(walletSql, [newUser.user_id]);

		const newWallet = walletResult.rows[0];

		return {
			...newUser,
			wallet_id: newWallet.wallet_id,
		};
	});
};
