import { RouterProvider } from 'react-router-dom';
import router from './components/router';
import { Toaster } from './components/ui/sonner';

function App() {
	return (
		<>
			<RouterProvider router={router} />
			<Toaster richColors position="top-center" />
		</>
	);
}

export default App;
