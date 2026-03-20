import { useMutation, useQuery } from '@tanstack/react-query';
import { privateAxios } from '../lib/axios';
import { API_URLS } from '../constants/urls';
import type { DepositData, TransferData } from '../types';

export const useDeposit = () => {
	return useMutation({
		mutationFn: (data: DepositData) =>
			privateAxios
				.post(API_URLS.WALLET.DEPOSIT, data, {
					headers: {
						'Idempotency-Key': crypto.randomUUID(),
					},
				})
				.then((res) => res.data),
	});
};

export const useTransfer = () => {
	return useMutation({
		mutationFn: (data: TransferData) =>
			privateAxios
				.post(API_URLS.WALLET.TRANSFER, data, {
					headers: {
						'Idempotency-Key': crypto.randomUUID(),
					},
				})
				.then((res) => res.data),
	});
};

export const useTransactionHistory = (user_id: string) => {
	return useQuery({
		queryKey: ['transactions', user_id],
		queryFn: () => privateAxios.get(API_URLS.WALLET.TRANSACTIONS(user_id)).then((res) => res.data),
		refetchInterval: 5000,
	});
};

export const useBalance = (user_id: string) => {
	return useQuery({
		queryKey: ['balance', user_id],
		queryFn: () => privateAxios.get(API_URLS.WALLET.BALANCE(user_id)).then((res) => res.data),
		refetchInterval: 5000,
	});
};
