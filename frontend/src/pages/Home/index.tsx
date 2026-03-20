/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import type { GeneralChangeEventType } from '../../types';
import { useCreateUser } from '../../hooks/useUser';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';
import { toast } from 'sonner';

const Home = () => {
	const [formData, setFormData] = useState({
		name: '',
	});

	const handleChange: GeneralChangeEventType = (event, name, value) => {
		name = event?.target.name || name || '';
		value = event?.target.value || value || '';

		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const { mutate, isPending } = useCreateUser();
	const navigate = useNavigate();

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		mutate(formData, {
			onSuccess: (res) => {
				localStorage.setItem('user', JSON.stringify(res.data));
				navigate(APP_ROUTES.DASHBOARD);
			},
			onError: (error: any) => {
				toast.error(error.response.data.message);
			},
		});
	};

	return (
		<main className="h-screen w-full flex items-center justify-center">
			<div className="flex flex-col items-center justify-center gap-8">
				<h1 className="text-3xl font-bold ">Welcome to Lance wallet</h1>

				<form className="flex flex-col gap-4 w-full max-w-md" onSubmit={handleSubmit}>
					<label htmlFor="name" className="flex flex-col gap-2">
						<span>Enter your name to get started</span>
						<Input
							placeholder="Enter your name"
							name="name"
							id="name"
							value={formData.name}
							onChange={handleChange}
						/>
					</label>
					<Button type="submit" disabled={isPending}>
						Create Account/Login
					</Button>
				</form>
			</div>
		</main>
	);
};

export default Home;
