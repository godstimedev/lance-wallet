/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '../../components/ui/table';
import type { GeneralChangeEventType, Transaction, User } from '../../types';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';
import { useBalance, useDeposit, useTransactionHistory, useTransfer } from '../../hooks/useWallet';
import { useQueryClient } from '@tanstack/react-query';
import { toMoney } from '../../utils/toMoney';
import { useFindUser } from '../../hooks/useUser';
import { toDateTime } from '../../utils/toDateTime';
import { toast } from 'sonner';

const Dashboard = () => {
	const user = JSON.parse(localStorage.getItem('user') || '{}') as User;
	const [depositFormData, setDepositFormData] = useState({
		amount: '',
	});
	const [transferFormData, setTransferFormData] = useState({
		amount: '',
		recipient: '',
	});

	const handleDepositChange: GeneralChangeEventType = (event, name, value) => {
		name = event?.target.name || name || '';
		value = event?.target.value || value || '';

		setDepositFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleTransferChange: GeneralChangeEventType = (event, name, value) => {
		name = event?.target.name || name || '';
		value = event?.target.value || value || '';

		setTransferFormData((prev) => ({ ...prev, [name]: value }));
	};

	const queryClient = useQueryClient();
	const { data: recipient } = useFindUser(
		{ name: transferFormData.recipient },
		{
			enabled: transferFormData.recipient.length > 0,
			queryKey: ['find-user', transferFormData.recipient],
		},
	);
	const { mutate: deposit, isPending: pendingDeposit } = useDeposit();
	const { mutate: transfer, isPending: pendingTransfer } = useTransfer();
	const { data: transactions } = useTransactionHistory(user.user_id);

	const handleDepositSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const data = { user_id: user.user_id, amount: Number(depositFormData.amount) };

		deposit(data, {
			onSuccess: () => {
				setDepositFormData((prev) => ({
					...prev,
					amount: '',
				}));
				queryClient.invalidateQueries({ queryKey: ['balance', user.user_id] });
				queryClient.invalidateQueries({ queryKey: ['transactions', user.user_id] });

				toast.success('Deposit successful');
			},
			onError: (error: any) => {
				toast.error(error.response.data.message);
			},
		});
	};

	const handleTransferSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!recipient?.data?.user_id) {
			toast.error('Recipient not found');
			return;
		}

		const data = {
			from_user_id: user.user_id,
			to_user_id: recipient?.data?.user_id,
			amount: Number(transferFormData.amount),
		};

		transfer(data, {
			onSuccess: (data) => {
				toast.success(data.data.description + ' successful');

				queryClient.invalidateQueries({ queryKey: ['balance', user.user_id] });
				queryClient.invalidateQueries({ queryKey: ['transactions', user.user_id] });

				setTransferFormData((prev) => ({
					...prev,
					amount: '',
					recipient: '',
				}));
			},
			onError: (error: any) => {
				toast.error(error.response.data.message);
			},
		});
	};

	const { data: balance } = useBalance(user.user_id);

	const navigate = useNavigate();

	const handleLogout = () => {
		localStorage.removeItem('user');
		navigate(APP_ROUTES.HOME);
	};

	useEffect(() => {
		const user = localStorage.getItem('user');
		if (!user) {
			navigate(APP_ROUTES.HOME);
		}
	}, [navigate]);

	return (
		<main className="min-h-screen w-full p-4">
			<header className="w-full flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-4">
				<div className="w-full">
					<h1 className="text-2xl font-semibol capitalize truncate">Welcome, {user?.name}</h1>
					<p className="text-muted-foreground">
						Your balance is:{' '}
						<span className="font-semibold text-foreground">
							₦{toMoney(balance?.data?.balance, false)}
						</span>
					</p>
				</div>

				<div className="flex items-center gap-4">
					<Dialog>
						<DialogTrigger asChild>
							<Button>Deposit</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Deposit Funds</DialogTitle>
								<DialogDescription>
									Enter the amount you want to deposit into your wallet.
								</DialogDescription>
							</DialogHeader>

							<form onSubmit={handleDepositSubmit} className="flex flex-col gap-4" autoComplete="off">
								<Input
									type="number"
									placeholder="Enter amount"
									name="amount"
									value={depositFormData.amount}
									onChange={handleDepositChange}
								/>
								<Button type="submit" disabled={pendingDeposit || !depositFormData.amount}>
									Deposit
								</Button>
							</form>
						</DialogContent>
					</Dialog>

					<Dialog>
						<DialogTrigger asChild>
							<Button>Transfer</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Transfer Funds</DialogTitle>
								<DialogDescription>
									Enter recipient name and the amount you want to transfer from your wallet.
								</DialogDescription>
							</DialogHeader>

							<form onSubmit={handleTransferSubmit} className="flex flex-col gap-4" autoComplete="off">
								<Input
									type="text"
									placeholder="Enter recipient name"
									name="recipient"
									value={transferFormData.recipient}
									onChange={handleTransferChange}
								/>
								<Input
									type="number"
									placeholder="Enter amount"
									name="amount"
									value={transferFormData.amount}
									onChange={handleTransferChange}
								/>
								<Button
									type="submit"
									disabled={pendingTransfer || !transferFormData.amount || !transferFormData.recipient}
								>
									Transfer
								</Button>
							</form>
						</DialogContent>
					</Dialog>

					<Button onClick={handleLogout} variant={'secondary'}>
						Logout
					</Button>
				</div>
			</header>

			<section className="mt-12 max-w-180 mx-auto space-y-4">
				<div className="flex items-center justify-between">
					<p className="text-xl font-semibold">Transaction history</p>
				</div>
				<Table>
					<TableCaption>Showing a list of your recent transactions.</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead className="w-25">Date</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Reference ID</TableHead>
							<TableHead className="text-right">Amount (₦)</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{transactions?.data?.transactions?.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="h-24 text-center">
									No transactions yet.
								</TableCell>
							</TableRow>
						) : (
							transactions?.data?.transactions?.map((transaction: Transaction) => (
								<TableRow key={transaction.transaction_id}>
									<TableCell>{toDateTime(transaction.created_at)}</TableCell>
									<TableCell className="capitalize">{transaction.description}</TableCell>
									<TableCell>{transaction.type}</TableCell>
									<TableCell className="font-medium truncate max-w-25">{transaction.reference_id}</TableCell>
									<TableCell
										className={`text-right ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}
									>
										{transaction.amount > 0
											? `+${toMoney(transaction.amount, false)}`
											: `-${toMoney(transaction.amount.toString().replace('-', ''), false)}`}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</section>
		</main>
	);
};

export default Dashboard;
