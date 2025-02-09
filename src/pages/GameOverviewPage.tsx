import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	getGameSessionData,
	getLeaderboardData,
} from "../lib/supabaseFunctions";
import ScoreUpdateModal from "../components/ScoreUpdateModal";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import { LineChart } from "../features/charts/LineChart";
import { BarChart } from "../features/charts/BarChart";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ChartDataLabels from "chartjs-plugin-datalabels";

// Register required Chart.js components.
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Title,
	Tooltip,
	Legend,
	ChartDataLabels
);

interface GameSession {
	id: string;
	name: string;
	date: string;
	players: Player[];
	scores: Score[];
}

interface Player {
	id: string;
	name: string;
}

interface Score {
	player_id: string;
	round: number;
	score: number;
}

interface LeaderboardItem {
	player_id: string;
	total_score: number;
	players: {
		name: string;
	};
}

function GameOverviewPage() {
	const { gameId } = useParams<{ gameId: string }>();
	const [gameSession, setGameSession] = useState<GameSession | null>(null);
	const [players, setPlayers] = useState<Player[]>([]);
	const [scores, setScores] = useState<Score[]>([]);
	const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
	const [isScoresUpdated, setIsScoresUpdated] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		async function fetchData() {
			if (!gameId) return;

			try {
				const gameSessionData = await getGameSessionData(gameId);
				if (gameSessionData) {
					setGameSession(gameSessionData);
					setPlayers(gameSessionData.players);
					setScores(gameSessionData.scores);
				}

				const leaderboard = await getLeaderboardData(gameId);
				console.log("Raw leaderboard data:", leaderboard);
				if (leaderboard) {
					setLeaderboardData(leaderboard as LeaderboardItem[]);
				}
			} catch (error) {
				console.error("Error fetching game session data:", error);
			}
		}

		fetchData();
	}, [gameId, isScoresUpdated]);

	// Calculate rounds from scores.
	const rounds = useMemo(() => {
		return [...new Set(scores.map((score) => score.round))].sort(
			(a, b) => a - b
		);
	}, [scores]);

	// Prepare data for the LineChart (score progression).
	const chartData = useMemo(() => {
		return {
			labels: rounds.map((round) => `Round ${round}`),
			datasets: players.map((player) => {
				const playerData = rounds.map((round) => {
					const scoreEntry = scores.find(
						(score) => score.player_id === player.id && score.round === round
					);
					return scoreEntry ? scoreEntry.score : 0;
				});
				const colors = [
					"rgb(255, 99, 132)", // Red
					"rgb(54, 162, 235)", // Blue
					"rgb(255, 206, 86)", // Yellow
					"rgb(75, 192, 192)", // Teal
					"rgb(153, 102, 255)", // Purple
					"rgb(255, 159, 64)", // Orange
				];
				const colorIndex =
					players.findIndex((p) => p.id === player.id) % colors.length;
				const color = colors[colorIndex];
				return {
					label: player.name,
					data: playerData,
					borderColor: color,
					backgroundColor: color,
				};
			}),
		};
	}, [rounds, players, scores]);

	// Prepare data for the BarChart (total points per player).
	const barChartData = useMemo(() => {
		const baseColors = [
			"rgb(255, 99, 132)", // Red
			"rgb(54, 162, 235)", // Blue
			"rgb(255, 206, 86)", // Yellow
			"rgb(75, 192, 192)", // Teal
			"rgb(153, 102, 255)", // Purple
			"rgb(255, 159, 64)", // Orange
		];

		// Convert colors to fully opaque for borderColor and 80% opacity for backgroundColor
		const borderColors = baseColors.map((color) => color); // Full opacity (100%)
		const backgroundColors = baseColors.map((color) =>
			color.replace("rgb", "rgba").replace(")", ", 0.8)")
		); // 80% opacity

		const data = {
			labels: leaderboardData.map((item) => item.players?.name || ""),
			datasets: [
				{
					label: "Total Points",
					data: leaderboardData.map((item) => item.total_score),
					borderColor: borderColors,
					backgroundColor: backgroundColors,
				},
			],
		};
		console.log("Bar chart data:", data);
		return data;
	}, [leaderboardData]);

	if (!gameSession) {
		return (
			<div className="text-center text-xl font-bold mt-10">
				Fetching game data...
			</div>
		);
	}

	const handleScoresUpdated = () => setIsScoresUpdated((prev) => !prev);

	return (
		<div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 h-screen bg-accent">
			{/* Left Column: Game Info and Leaderboard */}
			<div className="col-span-1 flex flex-col h-full">
				<Card className="flex-grow">
					<CardHeader>
						<div className="flex justify-between">
							<div>
								<CardTitle className="text-2xl font-bold">
									{gameSession.name}
								</CardTitle>
								<CardDescription>Date: {gameSession.date}</CardDescription>
							</div>
							<div className="flex items-center gap-4">
								<Button onClick={() => navigate(-1)}>Back</Button>
								{gameId && (
									<div>
										<ScoreUpdateModal
											gameSessionId={gameId}
											players={players}
											onScoresUpdated={handleScoresUpdated}
										/>
									</div>
								)}
							</div>
						</div>
					</CardHeader>
					{/* Leaderboard */}
					<CardHeader>
						<CardTitle>Leaderboard</CardTitle>
						<CardDescription>Top players in this game session.</CardDescription>
					</CardHeader>
					<CardContent>
						{/* Top 3 Players */}
						<div className="grid grid-cols-3 gap-4 mb-4 items-end">
							{leaderboardData.slice(0, 3).map((_item, index) => {
								// Reorder: player 2 -> 1 -> 3 (index 0 = player 2, index 1 = player 1, index 2 = player 3)
								const reorderedPlayers = [
									leaderboardData[1],
									leaderboardData[0],
									leaderboardData[2],
								];

								// Set different heights based on the index (tallest for 1, then 2, then shortest for 3)
								const heightClass =
									index === 0 ? "h-38" : index === 1 ? "h-46" : "h-32"; // Adjust these values for your desired heights

								return (
									<div
										key={reorderedPlayers[index].player_id}
										className={`flex flex-col items-center justify-center p-4 rounded-lg bg-gray-100 dark:bg-gray-700 ${heightClass}`}
									>
										<div className="text-2xl font-bold">
											{index === 0 ? 2 : index === 1 ? 1 : 3}
										</div>{" "}
										{/* Reorder index display */}
										<div className="text-3xl font-bold">
											{reorderedPlayers[index].players.name}
										</div>
										<div className="text-lg">
											{reorderedPlayers[index].total_score}
										</div>
									</div>
								);
							})}
						</div>

						{/* Remaining Players */}
						<ul>
							{leaderboardData.slice(3).map((item, index) => (
								<li
									key={item.player_id}
									className="flex items-center justify-between py-1 p-4"
								>
									<span>
										{index + 4}. {item.players.name}
									</span>
									<span>{item.total_score}</span>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			</div>

			{/* Right Column: Charts */}
			<div className="col-span-2 flex flex-col h-full space-y-4">
				{/* Score Progression (Line Chart) */}
				<Card>
					<CardHeader>
						<CardTitle className="text-2xl font-bold">
							Score Progression
						</CardTitle>
					</CardHeader>
					<CardContent className="h-80">
						<LineChart
							data={chartData}
							options={{ maintainAspectRatio: false }}
						/>
					</CardContent>
				</Card>

				{/* Total Points (Bar Chart) */}
				<Card className="flex-grow">
					<CardContent className="h-full">
						<BarChart
							data={barChartData}
							options={{
								maintainAspectRatio: false,
								indexAxis: "y",
								elements: { bar: { borderWidth: 2 } },
								plugins: {
									datalabels: {
										anchor: "end",
										align: "end",
										formatter: (value: number) => value,
									},
								},
							}}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default GameOverviewPage;
