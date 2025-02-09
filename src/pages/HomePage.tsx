import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface GameSession {
	id: string;
	name: string;
	date: string;
}

function HomePage() {
	const [showMore, setShowMore] = useState(false); // Manage the toggle state
	const [gameSessions, setGameSessions] = useState<GameSession[]>([]);

	useEffect(() => {
		async function fetchGameSessions() {
			const { data, error } = await supabase
				.from("Game Sessions")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Error fetching game sessions:", error);
			} else {
				// Sort sessions by date in descending order (latest first)
				const sortedSessions = data?.sort((a: GameSession, b: GameSession) => {
					// Assuming the date is in string format, you can convert it to Date
					return new Date(b.date).getTime() - new Date(a.date).getTime();
				});

				console.log("Fetched and sorted game sessions:", sortedSessions);
				setGameSessions(sortedSessions || []); // Set sorted sessions to state
			}
		}

		fetchGameSessions();
	}, []); // Empty dependency array to run only once on mount

	// Limit the sessions to the last 3, or all sessions if showMore is true
	const sessionsToShow = showMore ? gameSessions : gameSessions.slice(0, 3);

	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<h1 className="text-3xl font-bold mb-4">Game Session App!</h1>
			<Card className="w-[350px]">
				<CardHeader>
					<CardTitle>Previous Game Sessions</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="space-y-2">
						{sessionsToShow.map((session) => (
							<li key={session.id} className="border rounded-md p-2">
								<Link
									to={`/game/${session.id}`}
									className="flex justify-between items-center"
								>
									<span>{session.name}</span>
									<span>{session.date}</span>
								</Link>
							</li>
						))}
					</ul>

					{/* Toggle button to show more game sessions */}
					{gameSessions.length > 3 && (
						<div className="flex justify-center mt-4">
							<Button variant="default" onClick={() => setShowMore(!showMore)}>
								{showMore ? "Show Less" : "Show More"}
							</Button>
						</div>
					)}

					<Separator className="my-4" />
					<div className="flex justify-center">
						<Button variant="default" asChild>
							<Link to="/create">Create New Game Session</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default HomePage;
