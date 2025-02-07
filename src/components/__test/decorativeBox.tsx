import React from "react";

interface DecorativeBoxProps {
	className?: string; // Optional className prop for custom Tailwind classes
}

const DecorativeBox: React.FC<DecorativeBoxProps> = ({ className }) => {
	return (
		<div
			className={`w-full h-full rounded-md border bg-[repeating-linear-gradient(-45deg,_#EDEDF1_0px,_#EDEDF1_4px,_#e5e7eb_4px,_#e5e7eb_6px)] ${className}`}
		></div>
	);
};

export default DecorativeBox;
