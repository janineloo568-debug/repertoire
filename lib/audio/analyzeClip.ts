import decode from "audio-decode";
import type { AudioClipAnalysis } from "@/lib/db/schema";

const MIN_DURATION_SEC = 5;
const MAX_DURATION_SEC = 35;

function frameRms(samples: Float32Array, start: number, length: number) {
  let sum = 0;
  const end = Math.min(start + length, samples.length);
  for (let i = start; i < end; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / Math.max(1, end - start));
}

function estimateTempo(samples: Float32Array, sampleRate: number) {
  const frameSize = 2048;
  const hop = 1024;
  const energies: number[] = [];

  for (let i = 0; i + frameSize < samples.length; i += hop) {
    energies.push(frameRms(samples, i, frameSize));
  }

  if (energies.length < 8) {
    return { bpm: null as number | null, stability: "unknown" as const };
  }

  const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
  const std = Math.sqrt(
    energies.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, energies.length - 1)
  );
  const threshold = mean + std * 0.35;

  const peakTimes: number[] = [];
  for (let i = 1; i < energies.length - 1; i++) {
    if (energies[i] > threshold && energies[i] >= energies[i - 1] && energies[i] >= energies[i + 1]) {
      peakTimes.push((i * hop) / sampleRate);
    }
  }

  if (peakTimes.length < 3) {
    return { bpm: null as number | null, stability: "unknown" as const };
  }

  const intervals: number[] = [];
  for (let i = 1; i < peakTimes.length; i++) {
    const dt = peakTimes[i] - peakTimes[i - 1];
    if (dt >= 0.25 && dt <= 1.5) intervals.push(dt);
  }

  if (intervals.length < 2) {
    return { bpm: null as number | null, stability: "unknown" as const };
  }

  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)];
  const bpm = Math.round(60 / median);

  if (bpm < 40 || bpm > 220) {
    return { bpm: null as number | null, stability: "unknown" as const };
  }

  const intervalMean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const intervalStd = Math.sqrt(
    intervals.reduce((a, b) => a + (b - intervalMean) ** 2, 0) / intervals.length
  );
  const cv = intervalStd / intervalMean;
  const stability = cv < 0.18 ? ("steady" as const) : ("variable" as const);

  return { bpm, stability };
}

export async function analyzePracticeClip(buffer: Buffer): Promise<AudioClipAnalysis> {
  const audio = await decode(buffer);
  const sampleRate = audio.sampleRate;
  const channel = audio.channelData[0];
  if (!channel) {
    throw new Error("Could not read audio channel data.");
  }

  const durationSec = channel.length / sampleRate;

  if (durationSec < MIN_DURATION_SEC) {
    throw new Error(`Clip is too short — record at least ${MIN_DURATION_SEC} seconds.`);
  }
  if (durationSec > MAX_DURATION_SEC) {
    throw new Error(`Clip is too long — keep it under ${MAX_DURATION_SEC} seconds.`);
  }

  const frameSize = 2048;
  const rmsValues: number[] = [];
  for (let i = 0; i + frameSize < channel.length; i += frameSize) {
    rmsValues.push(frameRms(channel, i, frameSize));
  }

  const averageRms = rmsValues.length
    ? rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length
    : 0;
  const peakRms = rmsValues.length ? Math.max(...rmsValues) : 0;
  const dynamicRangeDb =
    averageRms > 0 && peakRms > 0 ? 20 * Math.log10(peakRms / averageRms) : 0;

  const { bpm, stability } = estimateTempo(channel, sampleRate);
  const onsetDensityPerMin = durationSec > 0 ? Math.round((rmsValues.length / durationSec) * 60 * 0.08) : 0;

  return {
    durationSec: Math.round(durationSec * 10) / 10,
    estimatedTempoBpm: bpm,
    tempoStability: stability,
    averageRms: Math.round(averageRms * 1000) / 1000,
    peakRms: Math.round(peakRms * 1000) / 1000,
    dynamicRangeDb: Math.round(dynamicRangeDb * 10) / 10,
    onsetDensityPerMin,
  };
}
