export const ROUTES = {
	USER: {
		CREATE: '/users',
		FIND_BY_NAME: '/users/find',
	},
	WALLET: {
		DEPOSIT: '/wallet/deposit',
		TRANSFER: '/wallet/transfer',
		TRANSACTIONS: '/wallet/:user_id/transactions',
		BALANCE: '/wallet/:user_id/balance',
	},
};
