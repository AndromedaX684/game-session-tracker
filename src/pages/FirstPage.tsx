import { useState } from "react";
import DecorativeBox from "@/components/__test/decorativeBox";

export default function FirstPage() {
	const [count, setCount] = useState(0);

	return (
		<div className="flex flex-col items-center justify-center h-screen w-screen overflow-auto">
			<h1>New Project!</h1>
			<div className="flex flex-col items-center p-4 gap-4">
				<button onClick={() => setCount((count) => count + 1)}>
					count is {count}
				</button>
				<p>Things should be working now. You can start editing this file</p>
			</div>
			<div className="flex flex-col items-center h-full w-full justify-center gap-4 bg-background text-foreground p-6">
				<h1 className="text-2xl font-bold">🎨 Decorative Box Demo</h1>
				<DecorativeBox />
				<DecorativeBox />
				<DecorativeBox />
			</div>
		</div>
	);
}
