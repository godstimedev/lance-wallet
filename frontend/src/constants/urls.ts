export const API_URLS = {
	USERS: {
		CREATE: '/users',
		FIND: '/users/find',
	},
	WALLET: {
		DEPOSIT: '/wallet/deposit',
		TRANSFER: '/wallet/transfer',
		BALANCE: (user_id: string) => `/wallet/${user_id}/balance`,
		TRANSACTIONS: (user_id: string) => `/wallet/${user_id}/transactions`,
	},
};

export const BASE_URL = import.meta.env.VITE_API_URL;
