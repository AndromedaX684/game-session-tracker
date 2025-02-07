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
	const [gameSessions, setGameSessions] = useState<GameSession[]>([]);

	useEffect(() => {
		async function fetchGameSessions() {
			const { data, error } = await supabase.from("Game Sessions").select("*");

			if (error) {
				console.error("Error fetching game sessions:", error);
			} else {
				console.log("Fetched game sessions:", data);
				setGameSessions(data as GameSession[]);
			}
		}

		fetchGameSessions();
	}, []);

	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<h1 className="text-3xl font-bold mb-4">Game Session App!</h1>
			<Card className="w-[350px]">
				<CardHeader>
					<CardTitle>Previous Game Sessions</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="space-y-2">
						{gameSessions.map((session) => (
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
