import { Router } from 'express';
import { ROUTES } from '../../configs/routes.js';
import { authMiddleware } from '../../middlewares/auth/index.js';
import {
	validateDeposit,
	validateGetBalance,
	validateGetTransactions,
	validateTransfer,
} from '../../middlewares/validate/index.js';
import { deposit, getBalance, getTransactions, transfer } from '../../controllers/wallet/index.js';

const walletRouter = Router();

walletRouter.post(ROUTES.WALLET.DEPOSIT, authMiddleware, validateDeposit, deposit);
walletRouter.post(ROUTES.WALLET.TRANSFER, authMiddleware, validateTransfer, transfer);
walletRouter.get(ROUTES.WALLET.BALANCE, authMiddleware, validateGetBalance, getBalance);
walletRouter.get(ROUTES.WALLET.TRANSACTIONS, authMiddleware, validateGetTransactions, getTransactions);

export default walletRouter;
