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
			"#FF758F", // pink from UI
			"#4A9FFF", // bright blue
			"#FFBB3B", // yellow/gold from rewards
			"#8B5CF6", // purple
			"#22D3EE", // cyan
			"#F472B6", // light pink
			"#60A5FA", // light blue
			"#A78BFA", // light purple
			"#38BDF8", // sky blue
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
	const chartData = useMemo(
		() => ({
			labels: rounds.map((round) => `Round ${round}`),
			datasets: players.map((player) => {
				let cumulativeSum = 0;
				const playerData = rounds.map((round) => {
					const scoreEntry = scores.find(
						(score) => score.player_id === player.id && score.round === round
					);
					if (scoreEntry) {
						cumulativeSum += scoreEntry.score;
					}
					return cumulativeSum;
				});

				const color = playerColors[player.id];
				return {
					label: player.name,
					data: playerData,
					borderColor: color,
					backgroundColor: color,
					borderWidth: 2,
				};
			}),
		}),
		[rounds, players, scores, playerColors]
	);

	const chartOptions = {
		maintainAspectRatio: false,
		scales: {
			x: {
				grid: {
					color: "rgba(255, 255, 255, 0.1)",
				},
				ticks: {
					color: "#ffffff",
				},
			},
			y: {
				grid: {
					color: "rgba(255, 255, 255, 0.1)",
				},
				ticks: {
					color: "#ffffff",
				},
			},
		},
		plugins: {
			legend: {
				labels: {
					color: "#ffffff",
				},
			},
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
						return `${context.dataset.label}: ${context.raw} points (Round: ${
							roundScore >= 0 ? "+" : ""
						}${roundScore})`;
					},
				},
			},
			datalabels: {
				align: "left",
				anchor: "end",
				backgroundColor: "rgba(255, 255, 255, 0.8)",
				offset: 5, // Moves labels further from points
				borderRadius: 4,
				padding: 4,
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
				font: { weight: "bold", size: "10px" },
				formatter: function (_value: any, context: any) {
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
		const borderColors = leaderboardData.map(
			(item) => playerColors[item.player_id]
		);
		const backgroundColors = borderColors.map((color) => `${color}CC`);

		return {
			labels: leaderboardData.map((item) => item.players?.name || ""),
			datasets: [
				{
					label: "Total Points",
					data: leaderboardData.map((item) => item.total_score),
					borderColor: borderColors,
					backgroundColor: backgroundColors,
					borderWidth: 2,
					datalabels: {
						color: "#ffffff",
						font: { weight: "bold" },
						align: "end",
						anchor: "end",
					},
				},
			],
		};
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
						<div className="grid grid-cols-3 gap-4 mb-4 items-end ">
							{leaderboardData.length === 0
								? players.map((player) => (
										<div
											key={player.id}
											className={`flex flex-col items-center justify-center p-4 rounded-lg`}
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
												className={`flex flex-col items-center justify-center p-4 rounded-lg bg-accent ${heightClass}`}
											>
												<div className="text-2xl font-bold">
													{index === 0 ? 2 : index === 1 ? 1 : 3}
												</div>
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
									className="flex items-center justify-between py-1 p-4 border rounded-md bg-secondary"
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
								scales: {
									x: {
										grid: {
											color: "rgba(255, 255, 255, 0.1)",
										},
										ticks: {
											color: "#ffffff",
										},
									},
									y: {
										grid: {
											color: "rgba(255, 255, 255, 0.1)",
										},
										ticks: {
											color: "#ffffff",
										},
									},
								},
								plugins: {
									legend: {
										labels: {
											color: "#ffffff",
										},
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
