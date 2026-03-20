import { useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import axios, { privateAxios } from '../lib/axios';
import { API_URLS } from '../constants/urls';

export const useCreateUser = () => {
	return useMutation({
		mutationFn: (data: { name: string }) =>
			axios.post(API_URLS.USERS.CREATE, data).then((res) => res.data),
	});
};

export const useFindUser = (params: { name: string }, options?: UseQueryOptions<any>) => {
	return useQuery({
		queryKey: ['user', params.name],
		queryFn: () => privateAxios.get(API_URLS.USERS.FIND, { params }).then((res) => res.data),
		...options,
	});
};
