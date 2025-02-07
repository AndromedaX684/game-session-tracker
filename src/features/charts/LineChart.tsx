// LineChart.tsx
import { useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js";

interface LineChartProps {
	data: any;
	options?: any;
	redraw?: boolean;
}

export function LineChart({ data, options, redraw }: LineChartProps) {
	const lineChartRef = useRef<ChartJS | null>(null);

	useEffect(() => {
		return () => {
			if (lineChartRef.current) {
				// Destroy the chart instance on unmount
				lineChartRef.current.destroy();
			}
		};
	}, []);

	return (
		<Line
			ref={lineChartRef as any}
			data={data}
			options={options}
			redraw={redraw}
		/>
	);
}
