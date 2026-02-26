"use client"

import Link from "next/link";
import { useEffect, useRef } from "react";

const songUrls: string[] = [
	"/music/23_25/LoWay.mp3",
	"/music/23_25/sampler.mp3",
	"/music/23_25/BassFirst.mp3",
	"/music/23_25/Stardust.mp3",
	"/music/debris/ding.mp3",
	"/music/debris/Swirl.mp3",
	"/music/debris/Arc2-NewSignals-1.mp3",
	"/music/debris/Arc2-NewSignals-2.mp3",
	"/music/debris/Arc3-Fin-1.mp3",
];

const barCounts = [48, 80];

type CalculationsType = {
	[k: string]: {
		audioUrl: string,
		[x: number]: number[];
	}
}
export default function CalculateWaveformData() {
	const calculations = useRef<CalculationsType>({});

	useEffect(() => {
		// TODO: how to get audioUrl
		const ctx = new AudioContext();

		Promise.all(
			songUrls.map(async (audioUrl) => {
				const response = await fetch(audioUrl);
				if (!response.ok) {
					return;
				}
				const arrayBuffer = await response.arrayBuffer();
				const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

				const tmp = barCounts.map(barCount => {
					return {
						[barCount]: CalculateWaveform(barCount, decodedBuffer),
					}
				}).reduce((prev, cur, i) => {
					return { ...prev, ...cur };
				});

				calculations.current[audioUrl] = {
					audioUrl: audioUrl,
					...tmp,
				}
			})
		).then(_ => console.log(calculations.current));
	}, []);

	return <div className="flex justify-center items-center min-h-screen">
		<Link href="/" className="text-4xl font-black">Go Back</Link>
	</div>
}

function CalculateWaveform(bars: number, buffer: AudioBuffer): number[] {
	const normalizedWaveformData: number[] = NormalizeWaveform(Waveform(buffer, bars));
	return normalizedWaveformData;
}

/**
 * Generates the waveform data from the raw audio
 * @param decodedBuffer the raw audio buffer
 * @returns
*/
function Waveform(decodedBuffer: AudioBuffer, totalWaveformpoints: number): number[] {
	const rawData = decodedBuffer.getChannelData(0);
	const blockSize = Math.floor(rawData.length / totalWaveformpoints);
	const filteredData = [];

	for (let i = 0; i < totalWaveformpoints; i++) {
		let sum = 0;
		for (let j = 0; j < blockSize; j++) {
			sum += Math.abs(rawData[i * blockSize + j]);
		}
		filteredData.push(sum / blockSize);
	}

	return filteredData;
}

function NormalizeWaveform(waveformData: number[]): number[] {
	const multiplier = Math.pow(Math.max(...waveformData), -1);
	const normalizedWaveformData = waveformData.map(n => n * multiplier);
	return normalizedWaveformData;
}