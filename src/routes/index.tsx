import { createBrowserRouter } from "react-router";

// Pages

// Layouts
import Page from "@/app/dashboard/page";

export const router = createBrowserRouter([
	{
		path: "/",
		element: <Page />, // Layout wraps everything
		children: [],
	},
]);
