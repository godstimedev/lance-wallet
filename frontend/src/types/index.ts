export interface User {
	name: string;
	wallet_id: string;
	user_id: string;
	token: string;
	created_at: string;
}

export interface Transaction {
	transaction_id: string;
	created_at: string;
	description: string;
	reference_id: string;
	wallet_id: string;
	type: 'DEPOSIT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
	amount: number;
}

export interface DepositData {
	user_id: string;
	amount: number;
}

export interface TransferData {
	from_user_id: string;
	to_user_id: string;
	amount: number;
}

export type GeneralChangeEventType = (
	event?: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | null,
	name?: string,
	value?: string | number | boolean | (string | number)[],
) => void;
