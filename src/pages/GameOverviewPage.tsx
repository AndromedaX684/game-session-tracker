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
				if (leaderboard) {
					setLeaderboardData(leaderboard as LeaderboardItem[]);
				}
			} catch (error) {
				console.error("Error fetching game session data:", error);
			}
		}

		fetchData();
	}, [gameId, isScoresUpdated]);

	// Colors for each player, based on their index in the players list.
	const colors = useMemo(() => {
		return [
			"rgb(255, 99, 132)", // Red
			"rgb(54, 162, 235)", // Blue
			"rgb(255, 206, 86)", // Yellow
			"rgb(75, 192, 192)", // Teal
			"rgb(153, 102, 255)", // Purple
			"rgb(255, 159, 64)", // Orange
		];
	}, []);

	// Create a color mapping for players
	const playerColors = useMemo(() => {
		const colorMap: { [key: string]: string } = {};
		players.forEach((player, index) => {
			colorMap[player.id] = colors[index % colors.length];
		});
		return colorMap;
	}, [players, colors]);

	// Calculate rounds from scores.
	const rounds = useMemo(() => {
		return [...new Set(scores.map((score) => score.round))].sort(
			(a, b) => a - b
		);
	}, [scores]);

	const getLastRoundDiff = (playerId: string) => {
		const lastRound = Math.max(...rounds);
		const lastRoundScore =
			scores.find(
				(score) => score.player_id === playerId && score.round === lastRound
			)?.score || 0;
		return lastRoundScore;
	};

	// Prepare data for the LineChart (score progression).
	const chartData = useMemo(() => {
		return {
			labels: rounds.map((round) => `Round ${round}`),
			datasets: players.map((player) => {
				let cumulativeSum = 0; // Track cumulative score per player
				const playerData = rounds.map((round) => {
					const scoreEntry = scores.find(
						(score) => score.player_id === player.id && score.round === round
					);
					if (scoreEntry) {
						cumulativeSum += scoreEntry.score; // Accumulate scores
					}
					return cumulativeSum; // For chart data: cumulative scores
				});

				const color = playerColors[player.id];

				return {
					label: player.name,
					data: playerData,
					borderColor: color,
					backgroundColor: color,
				};
			}),
		};
	}, [rounds, players, scores, playerColors]);

	const chartOptions = {
		maintainAspectRatio: false,
		plugins: {
			tooltip: {
				callbacks: {
					label: function (context: {
						dataIndex: any;
						dataset: { label: any };
						raw: any;
					}) {
						const roundIndex = context.dataIndex;
						const playerId = context.dataset.label;
						const round = rounds[roundIndex];
						const roundScore =
							scores.find(
								(score) =>
									score.player_id ===
										players.find((p) => p.name === playerId)?.id &&
									score.round === round
							)?.score || 0;

						const scoreColor =
							roundScore >= 0 ? "color: #22c55e" : "color: #ef4444";
						return `${context.dataset.label}: ${
							context.raw
						} points (Round: <span style="${scoreColor}">${
							roundScore >= 0 ? "+" : ""
						}${roundScore}</span>)`;
					},
				},
			},
			datalabels: {
				align: "top",
				color: (context: any) => {
					const roundIndex = context.dataIndex;
					const playerId = context.dataset.label;
					const round = rounds[roundIndex];
					const roundScore =
						scores.find(
							(score) =>
								score.player_id ===
									players.find((p) => p.name === playerId)?.id &&
								score.round === round
						)?.score || 0;
					return roundScore >= 0 ? "#22c55e" : "#ef4444";
				},
				font: { weight: "bold" },
				formatter: function (value: any, context: any) {
					const roundIndex = context.dataIndex;
					const playerId = context.dataset.label;
					const round = rounds[roundIndex];
					const roundScore =
						scores.find(
							(score) =>
								score.player_id ===
									players.find((p) => p.name === playerId)?.id &&
								score.round === round
						)?.score || 0;
					return roundScore >= 0 ? `+${roundScore}` : roundScore;
				},
			},
		},
	};

	// Prepare data for the BarChart (total points per player).
	const barChartData = useMemo(() => {
		// We need to make sure the players are in the correct order here
		const borderColors = leaderboardData.map((item) => {
			const playerId = item.player_id;
			return playerColors[playerId]; // Get the color for each player
		});

		const backgroundColors = borderColors.map(
			(color) => color.replace("rgb", "rgba").replace(")", ", 0.8)") // Make background color semi-transparent
		);

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

		return data;
	}, [leaderboardData, playerColors]);

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
								<Button onClick={() => navigate("/")}>Back</Button>
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
					<CardHeader className="flex flex-row justify-between">
						<div>
							<CardTitle>Leaderboard</CardTitle>
							<CardDescription>
								Top players in this game session.
							</CardDescription>
						</div>
						<div className="text-lg font-bold">
							Current Round: {rounds[rounds.length - 1] || "N/A"}
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-3 gap-4 mb-4 items-end">
							{leaderboardData.length === 0
								? players.map((player) => (
										<div
											key={player.id}
											className={`flex flex-col items-center justify-center p-4 rounded-lg bg-gray-100 dark:bg-gray-700`}
										>
											<div className="text-3xl font-bold">{player.name}</div>
										</div>
								  ))
								: leaderboardData.slice(0, 3).map((item, index) => {
										const reorderedPlayers = [
											leaderboardData[1],
											leaderboardData[0],
											leaderboardData[2],
										];

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
												<div
													className="text-3xl font-bold"
													style={{
														color:
															playerColors[reorderedPlayers[index].player_id],
													}}
												>
													{reorderedPlayers[index].players.name}
												</div>
												<div className="flex items-center gap-2">
													<span>
														{reorderedPlayers[index].total_score} points
													</span>
													{rounds.length > 0 && (
														<span
															className={`${
																getLastRoundDiff(item.player_id) >= 0
																	? "text-green-500"
																	: "text-red-500"
															} text-xs`}
														>
															{getLastRoundDiff(item.player_id) >= 0 ? "+" : ""}
															{getLastRoundDiff(item.player_id)}
														</span>
													)}
												</div>
											</div>
										);
								  })}
						</div>

						{/* Remaining Players */}
						<ul className="space-y-2">
							{leaderboardData.slice(3).map((item, index) => (
								<li
									key={item.player_id}
									className="flex items-center justify-between py-1 p-4 border rounded-md"
								>
									<div>
										<span className="mr-2">{index + 4}.</span>
										<span
											style={{
												color: playerColors[item.player_id], // Only color the name
											}}
											className="text-lg font-bold"
										>
											{item.players.name}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<span>{item.total_score} points</span>
										{rounds.length > 0 && (
											<span
												className={`${
													getLastRoundDiff(item.player_id) >= 0
														? "text-green-500"
														: "text-red-500"
												} text-xs`}
											>
												{getLastRoundDiff(item.player_id) >= 0 ? "+" : ""}
												{getLastRoundDiff(item.player_id)}
											</span>
										)}
									</div>
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
						<LineChart data={chartData} options={chartOptions} />
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
