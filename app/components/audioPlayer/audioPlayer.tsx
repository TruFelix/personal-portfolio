"use client"

import { MouseEvent, useEffect, useRef, useState } from "react";
import Knob from "../knob/knob";

function cn(...inputs: unknown[]) {
	return inputs.join(" ")
}

// SVG Paths from Figma
const PLAY_ICON_PATH = "M9.09327 0L18.1865 15.75H0L9.09327 0Z";
const PAUSE_ICON_PATH = "M18 0H7.86805e-08L0 4.48571L18 4.48571V0ZM18 13.4714L1.18021e-07 13.4714L7.86805e-08 18H18L18 13.4714Z";

interface AudioPlayerProps {
	audioUrl: string,
	barPlayedColor?: string,
	barNotPlayedColor?: string,
	barPlayedNotPlayingColor?: string,
	barsMaxHeight?: number
}

/**
 * Plays a given [audioUrl], shows its waveform and a volume knob.
 * Can be play/paused and shows progress via the [barPlayedColor] and [barNotPlayedColor].
 * Between play/pause visuals are animated.
 * According to the volume the waveform is taller more squashed.
 */
export function AudioPlayer({
	audioUrl,
	barPlayedNotPlayingColor = "hsl(from var(--primary) h 0 calc(l + 20))",
	barPlayedColor = "var(--primary)",
	barNotPlayedColor = "#d9d9d9",
	barsMaxHeight = 30 / 0.8,
}: AudioPlayerProps) {
	const minVolume = 0;
	const maxVolume = 10;
	const barsCount = 64;

	const [isPlaying, setIsPlaying] = useState(false);
	const [waveformData, setWaveformData] = useState<number[]>(new Array(barsCount).fill(0));
	const [volume, setVolume] = useState<number>(8);
	const [errorLoading, setErrorLoading] = useState<boolean>(false);

	const barsContainerRef = useRef<HTMLDivElement | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const audioBufferRef = useRef<AudioBuffer | null>(null);

	const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
	const gainNodeRef = useRef<GainNode | null>(null);

	const globalStartTimeRef = useRef<number>(0); // time from audioAPI
	const globalPausedAtRef = useRef<number>(0);

	// required to stop the indication of progress by animating the color of the bars
	const currentAnimQueue = useRef<number>(0);

	// Initialize AudioContext and load data
	useEffect(() => {
		loadAudio();

		return () => {
			if (audioContextRef.current) {
				audioContextRef.current.close();
			}
		};
	}, [audioUrl]);

	useEffect(() => {
		const cleanup = () => { };

		// don't use currentTime, because it has already setup start and pause times
		updateBarIndication(globalPausedAtRef.current);

		if (!isPlaying) {
			cancelAnimationFrame(currentAnimQueue.current)
			return cleanup;
		}
		currentAnimQueue.current = window.requestAnimationFrame(queueUpdateBarIndication);

		return cleanup;
	}, [isPlaying]);

	useEffect(() => {
		gainNodeRef.current?.gain.setValueAtTime((volume - minVolume) / maxVolume, 0);

		barsContainerRef.current?.childNodes.forEach(b => updateBarHeight(b as HTMLElement));
	}, [volume]);

	const togglePlay = async (e: MouseEvent) => {
		if (!audioContextRef.current || !audioBufferRef.current) return;

		if (isPlaying) {
			Pause();
		} else {
			await Play();
		}
	};

	return (
		<div className="flex">
			<button
				className={cn(
					"grid grid-flow-col grid-cols-[auto_1fr] items-center block cursor-pointer rounded-[6px] w-full h-[48px] transition-colors duration-300 ease-in-out",
					isPlaying ? "bg-[#282828]" : "bg-[rgba(138,138,138,0.65)]"
				)}
				data-name="AudioPlayer"
			>
				{/* Play/Pause Icon Container */}
				<div
					className="size-[22px] mx-2 ml-3 flex justify-items-center items-center"
					role="button"
					tabIndex={0}
					onClick={togglePlay}
				>
					<div className={cn(
						"flex-none transition-all duration-300",
						isPlaying ? "size-[18px]" : "size-[21px]"
					)}>
						{isPlaying ? (
							// Pause Icon
							<svg className="rotate-90" fill="none" preserveAspectRatio="1" viewBox="0 0 18 18">
								<path
									fillRule="evenodd"
									clipRule="evenodd"
									d={PAUSE_ICON_PATH}
									fill="var(--fill-0, #D9D9D9)"
								/>
							</svg>
						) : (
							// Play Icon
							<svg className="rotate-90 mt-[1px]" fill="none" preserveAspectRatio="1" viewBox="0 0 18.1865 15.75">
								<path d={PLAY_ICON_PATH} fill="var(--fill-0, #D9D9D9)" />
							</svg>
						)}
					</div>
				</div>
				<div
					className="flex gap-[2px] mr-3 h-[19px] items-center transition-all duration-300"
					ref={barsContainerRef}
				>
					{waveformData.map((value, index) => {
						// Calculate height between 3px and 19px based on value (0..1)
						// If value is very small, min height 3px.
						// Max height 19px.
						const height = Math.max(3, value * barsMaxHeight);

						let timestampInSeconds: number | null = null;
						if (audioBufferRef.current && audioContextRef.current) {
							const audioLengthInSeconds = audioBufferRef.current?.duration ?? 0
							const timeAdvancePerBarInSeconds = audioLengthInSeconds / barsCount;
							timestampInSeconds = timeAdvancePerBarInSeconds * (index + 1);
						}

						return (
							<div
								key={index}
								className={cn(
									errorLoading && "bg-orange-600",
									"bg-zink-300 grow min-w-[2px] rounded-[1px] transition-all duration-300",
									isPlaying && "shadow-[0px_0px_10px_0px_var(--primary)]",
								)}
								data-maxheight={height}
								style={{ height: `${height}px` }}
								onMouseUp={e => {
									if (timestampInSeconds != null) {
										e.bubbles = false;
										e.preventDefault();

										if (sourceNodeRef.current) {
											Pause();
										}

										PlayFrom(timestampInSeconds);
									}
								}}
								onMouseDown={Pause}
							/>
						);
					})}
				</div>
			</button>
			<div className="flex items-center ml-2">
				<Knob
					min={minVolume} max={maxVolume}
					step={0.1}
					value={volume}
					onChange={setVolume}
					label="vol"
				/>
			</div>
		</div>
	);

	async function PlayFrom(start: number) {
		globalPausedAtRef.current = start;
		// console.log("Starting from ", start);
		Play();
	}

	async function Play() {
		if (!audioContextRef.current) {
			console.error("audiocontext uninitialized");
			return;
		}

		if (audioContextRef.current.state === 'suspended') {
			await audioContextRef.current.resume();
		}

		if (sourceNodeRef.current) {
			// to set the time, just call play on the sourceNodeRef.current
			return;
		}
		const source = audioContextRef.current.createBufferSource();

		source.buffer = audioBufferRef.current;

		const gainNode = audioContextRef.current.createGain();
		gainNode.gain.value = (volume - minVolume) / maxVolume;
		gainNode.connect(audioContextRef.current.destination);
		source.connect(gainNode);

		// Loop playback for demo purposes? Or just stop at end?
		// Let's loop it or just handle end.
		source.onended = () => {
			// Only reset if it wasn't stopped manually
			// But for this simple implementation, we might not strictly need precise state syncing
			// if user just toggles.
			// We'll leave it as manual toggle for now.
		};

		console.log("was paused at: ", globalPausedAtRef.current);
		source.start(0, globalPausedAtRef.current);
		globalStartTimeRef.current = audioContextRef.current.currentTime;
		sourceNodeRef.current = source;
		gainNodeRef.current = gainNode;
		setIsPlaying(true);
	}

	function Pause() {
		if (sourceNodeRef.current) {
			sourceNodeRef.current.stop();
			sourceNodeRef.current = null;
		}
		globalPausedAtRef.current += (audioContextRef.current?.currentTime ?? 0) - globalStartTimeRef.current;
		console.log("paused at: ", globalPausedAtRef.current);
		setIsPlaying(false);
	}

	function updateBarHeight(bar: HTMLElement): void {
		const maxHeight = Number.parseFloat(bar.getAttribute("data-maxheight")!);
		bar.style.height = maxHeight * (volume - minVolume) / maxVolume + "px";
	}

	function queueUpdateBarIndication(): void {
		currentAnimQueue.current = requestAnimationFrame(queueUpdateBarIndication);
		updateBarIndication(currentTime());
	}

	function updateBarIndication(currentPlaytime: number): void {
		if (!barsContainerRef.current) return;

		const audioLengthInSeconds = audioBufferRef.current?.duration ?? 0;
		const timeAdvancePerBarInSeconds = audioLengthInSeconds / barsCount;
		let timestampInSeconds = 0.000001;

		for (let barIndex = 0; barIndex < barsContainerRef.current.childNodes.length; barIndex++) {
			timestampInSeconds += timeAdvancePerBarInSeconds;
			const bar = barsContainerRef.current.childNodes.item(barIndex) as HTMLElement;

			if (timestampInSeconds <= currentPlaytime) {
				if (isPlaying) {
					bar.style.backgroundColor = barPlayedColor;
				} else {
					bar.style.backgroundColor = barPlayedNotPlayingColor;
				}
			} else {
				bar.style.backgroundColor = barNotPlayedColor;
			}
		}
	}

	function currentTime(): number {
		const t = (audioContextRef.current?.currentTime ?? 0) - globalStartTimeRef.current + globalPausedAtRef.current;
		return t;
	}

	async function loadAudio() {
		try {
			const AudioContext = window.AudioContext;
			const ctx = new AudioContext();
			audioContextRef.current = ctx;

			const response = await fetch(audioUrl);
			if (!response.ok) {
				setErrorLoading(true);
				return;
			}
			const arrayBuffer = await response.arrayBuffer();
			const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
			audioBufferRef.current = decodedBuffer;

			const normalizedWaveformData = NormalizeWaveform(Waveform(decodedBuffer, barsCount));

			setWaveformData(normalizedWaveformData);
		} catch (error) {
			console.error("Failed to load audio:", error);
			setErrorLoading(true);
		}
	}

	function NormalizeWaveform(waveformData: number[]): number[] {
		const multiplier = Math.pow(Math.max(...waveformData), -1);
		const normalizedWaveformData = waveformData.map(n => n * multiplier);
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
}
