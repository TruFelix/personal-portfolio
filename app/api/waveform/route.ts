import { NextRequest, NextResponse } from 'next/server';

import { waveformData as waveforms } from './data';

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

function CalculateWaveform(bars: number, buffer: AudioBuffer): number[] {
	const normalizedWaveformData: number[] = NormalizeWaveform(Waveform(buffer, bars));
	return normalizedWaveformData;
}

function NormalizeWaveform(waveformData: number[]): number[] {
	const multiplier = Math.pow(Math.max(...waveformData), -1);
	const normalizedWaveformData = waveformData.map(n => n * multiplier);
	return normalizedWaveformData;
}
export async function GET(request: NextRequest) {
	const query = request.nextUrl.searchParams;

	if (!query.get("audioUrl") || !decodeURIComponent(query.get("audioUrl")!)) {
		return new Response("'audioUrl' needs to be specified as a string, representing a file path relative to /public", {
			status: 400,
		});
	}

	const body = { audioUrl: query.get("audioUrl")! };

	// const dir = path.resolve('./public', "music/23_25/LoWay.mp3");
	// const buf = fs.readFileSync(dir).buffer;

	// const context = new AudioContext();
	// const decodedBuffer = await context.decodeAudioData(buf);
	// const waveformData = CalculateWaveform(body.barCount, decodedBuffer);


	const waveformData = waveforms[body.audioUrl];

	if (!waveformData) {
		return new NextResponse("Invalid file+barCount configuration!", {
			status: 404,
		});
	}

	return NextResponse.json(waveformData, {
		status: 200,
	});
}