// BarChart.tsx
import { useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js";

interface BarChartProps {
	data: any;
	options?: any;
	redraw?: boolean;
}

export function BarChart({ data, options, redraw }: BarChartProps) {
	const barChartRef = useRef<ChartJS | null>(null);

	useEffect(() => {
		return () => {
			if (barChartRef.current) {
				barChartRef.current.destroy();
			}
		};
	}, []);

	return (
		<Bar
			ref={barChartRef as any}
			data={data}
			options={options}
			redraw={redraw}
		/>
	);
}
