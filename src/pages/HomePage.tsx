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
		<div className="flex items-center justify-center h-screen">
			<Card className="w-[350px]">
				<CardHeader>
					<CardTitle>Game Sessions</CardTitle>
				</CardHeader>
				<CardContent>
					<ul>
						{gameSessions.map((session) => (
							<li key={session.id}>
								<Link to={`/game/${session.id}`}>{session.name}</Link>
							</li>
						))}
					</ul>
					<Separator className="my-4" />
					<Button variant="default" asChild>
						<Link to="/create">Create New Game Session</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

export default HomePage;
