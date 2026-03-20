import 'dotenv/config';
import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import { logger } from '../utils/logger.js';

export const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

export const query = async (text: string, params?: any[]) => {
	return await pool.query(text, params);
};

export const withTransaction = async <T>(
	callback: (client: PoolClient) => Promise<T>,
): Promise<T> => {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const result = await callback(client);
		await client.query('COMMIT');
		return result;
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
};

export const initializeDB = async () => {
	try {
		await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        name VARCHAR NOT NULL UNIQUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS wallets (
                        wallet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id UUID NOT NULL UNIQUE,
                        FOREIGN KEY (user_id) REFERENCES users(user_id)
                );

                CREATE TABLE IF NOT EXISTS transactions (
                        transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        debited UUID NOT NULL,
                        credited UUID NOT NULL, 
                        amount INT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        reference_id UUID NOT NULL UNIQUE,

                        FOREIGN KEY (debited) REFERENCES wallets(wallet_id),
                        FOREIGN KEY (credited) REFERENCES wallets(wallet_id)
                );

                CREATE INDEX IF NOT EXISTS debited_idx ON transactions (debited);
                CREATE INDEX IF NOT EXISTS credited_idx ON transactions (credited);

                CREATE TABLE IF NOT EXISTS ledger (
                        transaction_id UUID NOT NULL, 
                        wallet_id UUID NOT NULL,
                        amount INT NOT NULL,

                        FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id),
                        FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id)
                );

                CREATE INDEX IF NOT EXISTS ledger_wallet_idx ON ledger (wallet_id);

                INSERT INTO users (user_id, name) 
                VALUES ('00000000-0000-0000-0000-000000000000', 'Lance System') 
                ON CONFLICT DO NOTHING;

                INSERT INTO wallets (wallet_id, user_id) 
                VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000') 
                ON CONFLICT DO NOTHING;
        `);
		logger.info('Database tables initialized successfully.');
	} catch (error) {
		logger.info(`Database initialization error: ${error}`);
		throw error;
	}
};
