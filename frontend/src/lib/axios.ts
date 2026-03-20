import axios from 'axios';
import { BASE_URL } from '../constants/urls';
import type { User } from '../types';

export default axios.create({
	baseURL: BASE_URL,
	headers: { 'Content-Type': 'application/json' },
});

export const privateAxios = axios.create({
	baseURL: BASE_URL,
	headers: { 'Content-Type': 'application/json' },
});

privateAxios.interceptors.request.use((config) => {
	const user = JSON.parse(localStorage.getItem('user') || '{}') as User;
	if (user.token) {
		config.headers.Authorization = `Bearer ${user.token}`;
	}
	return config;
});
