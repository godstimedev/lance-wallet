import { Router } from 'express';
import { ROUTES } from '../../configs/routes.js';
import { createUser, findUserByName } from '../../controllers/user/index.js';
import { validateCreateUser, validateFindUser } from '../../middlewares/validate/index.js';

const userRouter = Router();

userRouter.get(ROUTES.USER.FIND_BY_NAME, validateFindUser, findUserByName);
userRouter.post(ROUTES.USER.CREATE, validateCreateUser, createUser);

export default userRouter;
