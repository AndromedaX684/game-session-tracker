import { createBrowserRouter } from "react-router-dom";
import HomePage from "../pages/HomePage";
import CreateGameSessionPage from "../pages/CreateGameSession";
import GameOverviewPage from "../pages/GameOverviewPage";

// Layouts
import Page from "@/app/dashboard/page";

export const router = createBrowserRouter([
	{
		path: "/",
		element: <HomePage />,
		children: [],
	},
	{
		path: "/create",
		element: <CreateGameSessionPage />,
		children: [],
	},
	{
		path: "/game/:gameId",
		element: <GameOverviewPage />,
		children: [],
	},
]);
