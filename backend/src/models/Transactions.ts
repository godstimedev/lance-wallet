import { query, withTransaction } from '../db/connection.js';
import { SYSTEM_WALLET_ID } from '../constants/index.js';

export const depositFunds = async (walletId: string, amount: number, referenceId: string) => {
	return await withTransaction(async (client) => {
		const txnSql = `
        INSERT INTO transactions (credited, debited, amount, reference_id)
        VALUES ($1, $2, $3, $4) RETURNING transaction_id
    `;
		// Record the event: The System Wallet acts as the funding source for external deposits
		const result = await client.query(txnSql, [walletId, SYSTEM_WALLET_ID, amount, referenceId]);
		const transactionId = result.rows[0].transaction_id;

		const ledgerSql = `
			INSERT INTO ledger (transaction_id, wallet_id, amount)
			VALUES ($1, $2, $3)
		`;

		// Credit the user's wallet
		await client.query(ledgerSql, [transactionId, walletId, amount]);

		// Debit the system wallet
		// NOTE: Enforcing Strict Double-Entry Accounting
		// To maintain a zero-sum ledger (where the sum of all balances always equals exactly 0),
		// we must offset the user's credit. Debiting the System Wallet balances the books
		// and perfectly tracks the total amount of external real-world cash held by the platform.
		await client.query(ledgerSql, [transactionId, SYSTEM_WALLET_ID, -amount]);

		return result.rows[0];
	});
};

export const transferFunds = async (
	fromUserId: string,
	toUserId: string,
	amount: number,
	idempotencyKey: string,
) => {
	return await withTransaction(async (client) => {
		const senderWallet = await client.query(
			'SELECT w.wallet_id, u.name FROM wallets w JOIN users u ON w.user_id = u.user_id WHERE w.user_id = $1 FOR UPDATE',
			[fromUserId],
		);
		const receiverWallet = await client.query(
			'SELECT w.wallet_id, u.name FROM wallets w JOIN users u ON w.user_id = u.user_id WHERE w.user_id = $1',
			[toUserId],
		);

		if (senderWallet.rowCount === 0) throw new Error('Sender wallet not found');
		if (receiverWallet.rowCount === 0) throw new Error('Receiver wallet not found');

		const senderWalletId = senderWallet.rows[0].wallet_id;
		const receiverWalletId = receiverWallet.rows[0].wallet_id;
		const receiverName = receiverWallet.rows[0].name;

		const senderBalanceResult = await client.query(
			`SELECT COALESCE(SUM(amount), 0) AS balance
            FROM ledger
            WHERE wallet_id = $1`,
			[senderWalletId],
		);

		const currentBalance = parseFloat(senderBalanceResult.rows[0].balance);
		if (currentBalance < amount) {
			const error = new Error('Insufficient funds');
			error.name = 'INSUFFICIENT_FUNDS';
			throw error;
		}

		const txnResult = await client.query(
			`INSERT INTO transactions (debited, credited, amount, reference_id)
            VALUES ($1, $2, $3, $4)
            RETURNING transaction_id, created_at`,
			[senderWalletId, receiverWalletId, amount, idempotencyKey],
		);
		const transactionId = txnResult.rows[0].transaction_id;

		await client.query(
			`INSERT INTO ledger (transaction_id, wallet_id, amount) 
			VALUES ($1, $2, $3)`,
			[transactionId, senderWalletId, -amount],
		);

		await client.query(
			`INSERT INTO ledger (transaction_id, wallet_id, amount) 
			VALUES ($1, $2, $3)`,
			[transactionId, receiverWalletId, amount],
		);

		return {
			transaction_id: transactionId,
			amount: -amount,
			type: 'TRANSFER_OUT',
			description: `Transfer to ${receiverName}`,
			created_at: txnResult.rows[0].created_at,
		};
	});
};

export const getWalletBalance = async (walledId: string): Promise<number> => {
	const sql = `SELECT COALESCE(SUM(amount), 0) AS balance FROM ledger WHERE wallet_id = $1`;
	const result = await query(sql, [walledId]);

	return parseFloat(result.rows[0].balance);
};

export const getTransactionHistory = async (walletId: string) => {
	const sql = `
        SELECT 
            t.transaction_id AS id,
            t.created_at,
            t.reference_id,
            l.amount,
            
            -- DYNAMIC TYPE: Intercept the System Wallet for Deposits
            CASE 
                WHEN l.amount < 0 THEN 'TRANSFER_OUT'
                WHEN t.debited = '${SYSTEM_WALLET_ID}' THEN 'DEPOSIT'
                ELSE 'TRANSFER_IN'
            END AS type,
            
            -- DYNAMIC DESCRIPTION: Clean up the UI text for deposits
            CASE 
                WHEN l.amount < 0 THEN 
                    'Transfer to ' || (SELECT name FROM users u JOIN wallets w ON u.user_id = w.user_id WHERE w.wallet_id = t.credited)
                WHEN t.debited = '${SYSTEM_WALLET_ID}' THEN 
                    'Wallet Deposit'
                ELSE 
                    'Received from ' || (SELECT name FROM users u JOIN wallets w ON u.user_id = w.user_id WHERE w.wallet_id = t.debited)
            END AS description
            
        FROM ledger l
        JOIN transactions t ON l.transaction_id = t.transaction_id
        WHERE l.wallet_id = $1
        ORDER BY t.created_at DESC
    `;

	const result = await query(sql, [walletId]);
	return result.rows;
};
