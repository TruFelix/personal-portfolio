"use client"

import { MouseEvent, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ActivePlayerContext } from "../contexts";
import Knob from "../knob/knob";
import { useWindowSize } from "../utils";

// SVG Paths from Figma
const PLAY_ICON_PATH = "M9.09327 0L18.1865 15.75H0L9.09327 0Z";
const PAUSE_ICON_PATH = "M18 0H7.86805e-08L0 4.48571L18 4.48571V0ZM18 13.4714L1.18021e-07 13.4714L7.86805e-08 18H18L18 13.4714Z";

interface AudioPlayerProps {
	audioUrl: string,
	barPlayedColor?: string,
	barNotPlayedColor?: string,
	barPlayedNotPlayingColor?: string,
	barsMaxHeight?: number,
	barsCount?: number,
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

	const { activePlayer, setActivePlayer } = useContext(ActivePlayerContext);

	const size = useWindowSize(null);
	const isMobile = size?.width ?? 0 < 600;
	const [barsCount, setBarsCount] = useState<number>(isMobile ? 48 : 80);

	const [isAudioLoaded, setIsAudioLoaded] = useState<boolean>(false);
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

	const volumePercent = useMemo(() => (volume - minVolume) / maxVolume, [volume, minVolume, maxVolume]);

	useEffect(() => {
		// console.log("size: ", size?.width, "barsCount: ", barsCount);
		const isMobile = (size?.width ?? 0) < 600;
		setBarsCount(isMobile ? 48 : 80);
	}, [size]);

	// Initialize AudioContext and load data
	useEffect(() => {
		const loadingInterval = setInterval(() => animateBarsLoading(0.75, 3), 100);
		loadAudio().then(() => clearInterval(loadingInterval));


		return () => {
			if (audioContextRef.current) {
				audioContextRef.current.close();
			}
		};
	}, [audioUrl]);

	const memoizedWaveformData = useMemo(() => {
		if (isAudioLoaded && audioBufferRef.current) return CalculateWaveform(barsCount) as number[];
		return waveformData;
	}, [isAudioLoaded, barsCount, isMobile]);

	useEffect(() => {
		// console.log("barsCount: ", barsCount);
		setWaveformData(memoizedWaveformData);

		if (audioBufferRef.current) {
			setWaveformData(memoizedWaveformData);

			// don't use currentTime, because it has already setup start and pause times
			updateBarIndication(globalPausedAtRef.current);
		}
	}, [isAudioLoaded, memoizedWaveformData]);

	useEffect(() => {
		const cleanup = () => {
			cancelAnimationFrame(currentAnimQueue.current);
		};

		// don't use currentTime, because it has already setup start and pause times
		updateBarIndication(globalPausedAtRef.current);

		if (!isPlaying || (activePlayer && activePlayer.url != audioUrl)) {
			cleanup();
			return cleanup;
		}

		if ((activePlayer && activePlayer.url === audioUrl) || !activePlayer) {
			currentAnimQueue.current = window.requestAnimationFrame(queueUpdateBarIndication);
		}

		return cleanup;
	}, [isPlaying, activePlayer?.url]);

	useEffect(() => {
		gainNodeRef.current?.gain.setValueAtTime(volumePercent, 0);

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
		<div className="grid grid-flow-col grid-cols-[1fr_auto] gap-1.5">
			<button
				className={cn(
					"grid grid-flow-col grid-cols-[auto_1fr] items-center block cursor-pointer rounded-[6px] w-full h-[48px] transition-colors duration-300 ease-in-out",
					isPlaying ? "bg-neutral-100 dark:bg-neutral-700" : "bg-neutral-100 dark:bg-[rgba(138,138,138,0.65)]"
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
									className="fill-neutral-400 dark:fill-neutral-300"
								/>
							</svg>
						) : (
							// Play Icon
							<svg className="rotate-90 mt-[1px]" fill="none" preserveAspectRatio="1" viewBox="0 0 18.1865 15.75">
								<path d={PLAY_ICON_PATH}
									className="fill-neutral-400 dark:fill-neutral-300"
								/>
							</svg>
						)}
					</div>
				</div>
				<div
					className="flex mr-3 h-[19px] items-center transition-all duration-300"
					ref={barsContainerRef}
				>
					{waveformData.map((value, index) => {
						// Calculate height between 3px and 19px based on value (0..1)
						// If value is very small, min height 3px.
						// Max height 19px.
						const height = Math.max(3, value * barsMaxHeight * volumePercent);

						let timestampInSeconds: number | null = null;
						if (audioBufferRef.current && audioContextRef.current) {
							const audioLengthInSeconds = audioBufferRef.current?.duration ?? 0
							const timeAdvancePerBarInSeconds = audioLengthInSeconds / barsCount;
							timestampInSeconds = timeAdvancePerBarInSeconds * (index + 1);
						}
						const currentT = currentTime();

						return (
							<div
								key={index}
								className={cn(
									errorLoading && "bg-orange-600",
									"bg-zinc-300 grow min-w-[1px] rounded-[1px] transition-all duration-300 mx-[1px]",
									isPlaying && "dark:shadow-[0px_0px_10px_0px_var(--primary)]",
									// isPlaying && (timestampInSeconds < currentT
									// 	? "shadow-[0px_0px_10px_0px_var(--color-primary-transparent-500)]"
									// 	: `shadow-[0px_0px_5px_0px_gray] shadow-color-[gray]`)
								)}
								data-maxheight={height}
								style={{
									height: `${height}px`,
									backgroundColor: barBackgroundColorFromTimestamp(timestampInSeconds ?? 0, currentT),
									// boxShadow: barShadowFromTimestamp(timestampInSeconds, currentT)
								}}
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
					width="38px"
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
		if (activePlayer?.url != audioUrl) {
			activePlayer?.Pause();
		}

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
		gainNode.gain.value = volumePercent;
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

		// console.log("was paused at: ", globalPausedAtRef.current);
		source.start(0, globalPausedAtRef.current);
		globalStartTimeRef.current = audioContextRef.current.currentTime;
		sourceNodeRef.current = source;
		gainNodeRef.current = gainNode;
		setIsPlaying(true);
		setActivePlayer?.({
			url: audioUrl,
			Pause,
		});
	}

	function Pause() {
		if (sourceNodeRef.current) {
			sourceNodeRef.current.stop();
			sourceNodeRef.current = null;
		}
		globalPausedAtRef.current += (audioContextRef.current?.currentTime ?? 0) - globalStartTimeRef.current;
		console.log("paused at: ", globalPausedAtRef.current);
		setIsPlaying(false);
		if (activePlayer?.url == audioUrl) setActivePlayer?.(null);
	}

	function updateBarHeight(bar: HTMLElement): void {
		const maxHeight = Number.parseFloat(bar.getAttribute("data-maxheight")!);
		bar.style.height = maxHeight * volumePercent + "px";
	}

	function queueUpdateBarIndication(): void {
		currentAnimQueue.current = requestAnimationFrame(queueUpdateBarIndication);
		updateBarIndication(currentTime());
	}

	function updateBarIndication(currentPlaytime: number): void {
		if (!barsContainerRef.current) return;
		if (errorLoading) return;

		const audioLengthInSeconds = audioBufferRef.current?.duration ?? 0;
		const timeAdvancePerBarInSeconds = audioLengthInSeconds / barsCount;
		let timestampInSeconds = 0.000001;

		for (let barIndex = 0; barIndex < barsContainerRef.current.childNodes.length; barIndex++) {
			timestampInSeconds += timeAdvancePerBarInSeconds;
			const bar = barsContainerRef.current.childNodes.item(barIndex) as HTMLDivElement;
			bar.style.backgroundColor = barBackgroundColorFromTimestamp(timestampInSeconds, currentPlaytime) ?? "";
			bar.style.boxShadow = barShadowFromTimestamp(timestampInSeconds, currentPlaytime) ?? "";
			// console.log(bar.style.boxShadow);
		}
	}

	function barBackgroundColorFromTimestamp(timestampInSeconds: number, currentPlaytime: number): string | undefined {
		if (!isAudioLoaded) return undefined;

		if (timestampInSeconds <= currentPlaytime) {
			if (isPlaying) {
				return barPlayedColor;
			} else {
				return barPlayedNotPlayingColor;
			}
		} else {
			return barNotPlayedColor;
		}
	}
	function barShadowFromTimestamp(timestampInSeconds: number, currentPlaytime: number): string | null | undefined {
		const isDarkTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')?.matches;
		if (isDarkTheme) return null;

		if (!isPlaying) return null;

		if (timestampInSeconds < currentPlaytime) {
			return "0px 0px 10px 0px var(--color-primary-transparent-500)";
		} else {
			return "0px 0px 2.5px 0px rgb(from gray r g b / 0.2)";
		}
	}

	function currentTime(): number {
		const t = (audioContextRef.current?.currentTime ?? 0) - globalStartTimeRef.current + globalPausedAtRef.current;
		return t;
	}

	/** Animates the wavebarData to create a loading animation */
	function animateBarsLoading(freq: number = 1, travelspeed: number = 1) {
		const millis = new Date().valueOf();
		const tmp = new Array(barsCount).fill(0).map((_, i) => (Math.sin(i / 3 * freq - millis / 500 * travelspeed) + 1) / 2);
		setWaveformData(tmp);
	}

	//#region audio loading and computation
	async function loadAudio() {
		try {
			const AudioContext = window.AudioContext;
			const ctx = new AudioContext();
			audioContextRef.current = ctx;

			const response = await fetch(audioUrl);
			if (!response.ok) {
				setIsAudioLoaded(false);
				setErrorLoading(true);
				return;
			}
			const arrayBuffer = await response.arrayBuffer();
			const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
			audioBufferRef.current = decodedBuffer;
			setIsAudioLoaded(true);
		} catch (error) {
			console.error("Failed to load audio:", error);
			setErrorLoading(true);
			setIsAudioLoaded(false);
		}
	}

	function CalculateWaveform(bars: number): number[] | undefined {
		if (!audioBufferRef.current) return undefined;
		const normalizedWaveformData = NormalizeWaveform(Waveform(audioBufferRef.current, bars));
		return normalizedWaveformData;
		// setWaveformData(normalizedWaveformData);
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
	//#endregion
}

function cn(...inputs: unknown[]) {
	return inputs.join(" ")
}