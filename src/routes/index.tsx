import { createBrowserRouter } from "react-router";

// Pages

// Layouts
import Layout from "@/layouts/layout";
import FirstPage from "@/pages/FirstPage";

export const router = createBrowserRouter([
	{
		path: "/",
		element: <Layout />, // Layout wraps everything
		children: [
			{
				path: "/",
				element: <FirstPage />, // FirstPage is inside Layout
			},
		],
	},
]);
