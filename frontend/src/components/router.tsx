import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { APP_ROUTES } from '../constants/routes';
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';

const routes: RouteObject[] = [
	{
		element: <Home />,
		path: APP_ROUTES.HOME,
	},
	{
		element: <Dashboard />,
		path: APP_ROUTES.DASHBOARD,
	},
];
const router = createBrowserRouter(routes);

export default router;
