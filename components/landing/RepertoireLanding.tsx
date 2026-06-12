import Image from "next/image";
import Link from "next/link";
import { landingAssets } from "./assets";
import { PieceShowcaseCard } from "./PieceShowcaseCard";

const dailyMix = [
  {
    title: "Wagon Wheel",
    composer: "Darius Rucker",
    genreLabel: "Country Pop",
    texture: "b" as const,
  },
  {
    title: "Clair de Lune",
    composer: "Claude Debussy",
    genreLabel: "Impressionism",
    texture: "a" as const,
  },
  {
    title: "Up Theme",
    composer: "Michael Giacchino",
    genreLabel: "Contemporary",
    texture: "a" as const,
  },
  {
    title: "Summer of '69",
    composer: "Bryan Adams",
    genreLabel: "Country Pop",
    texture: "b" as const,
  },
];

export function RepertoireLanding() {
  return (
    <div className="bg-sheet-canvas text-sheet-ink">
      <section className="relative overflow-hidden pb-24 pt-10 sm:pb-28 sm:pt-14 lg:pb-32 lg:pt-20">
        <div className="pointer-events-none absolute inset-0 bg-[#faf8f6]" aria-hidden />
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
          <Image
            src={landingAssets.heroIllustration}
            alt=""
            width={1600}
            height={900}
            className="absolute left-[-2%] top-[5%] h-auto w-[104%] max-w-none object-cover"
            priority
          />
        </div>

        <div className="relative mx-auto flex max-w-[896px] flex-col items-center px-6 text-center">
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#333] px-3 py-1">
              <span className="size-2 shrink-0 rounded-full bg-[#7c3aed]" aria-hidden />
              <span className="text-xs font-medium leading-4 text-[#a3a3a3]">Now in open beta</span>
            </div>
          </div>

          <h1 className="font-display mx-auto max-w-[42rem] text-5xl font-normal leading-none tracking-[-2px] text-black sm:text-6xl sm:leading-none lg:text-[80px] lg:leading-[80px]">
            <span className="block">Your entire library,</span>
            <span className="block text-[#a3a3a3]">orchestrated.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-[38rem] text-lg font-light leading-7 text-[#181818] sm:text-xl">
            Repertoire is what musicians have been waiting for. Organize your sheet music by vibe, rediscover songs you
            forgot you knew, and find new pieces you&apos;ll actually want to learn.
          </p>

          <div className="mt-10">
            <Link
              href="/register"
              className="inline-flex rounded-sm bg-[#7c3aed] px-8 py-4 text-base font-medium leading-6 text-white shadow-[0_0_10px_rgba(124,58,237,0.15)] transition-colors hover:bg-[#6d28d9]"
            >
              Start your library
            </Link>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto flex max-w-[1304px] flex-col gap-12 px-6 py-20 lg:flex-row lg:gap-16 lg:py-32"
      >
        <div className="flex max-w-[413px] flex-col gap-6">
          <h2 className="font-display text-4xl font-normal leading-[40px] tracking-tight text-black">
            A place for every note.
          </h2>
          <p className="text-lg leading-[29px] text-[#a3a3a3]">
            Tag, categorize, and track your progress. Whether it&apos;s a piece you&apos;re actively mastering or an
            ensemble score for next season, your entire repertoire is instantly accessible.
          </p>
          <ul className="flex flex-col gap-4 pt-2">
            {[
              "Custom tagging system",
              "Personalized practice tracking & logs",
              "Rediscover songs you forgot you knew",
            ].map((label) => (
              <li key={label} className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={landingAssets.listCheck} alt="" width={20} height={20} className="size-5 shrink-0" />
                <span className="text-sm leading-5 text-black">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div id="library" className="grid flex-1 gap-6 sm:grid-cols-2">
          <PieceShowcaseCard
            title={`Comptine d'un Autre été`}
            composer="Yann Tiersen"
            statusLabel="Mastered"
            statusTone="mastered"
            genreLabel="Contemporary Classical"
          />
          <PieceShowcaseCard
            title="Interstellar (Main Theme)"
            composer="Hans Zimmer"
            statusLabel="Learning"
            statusTone="learning"
            genreLabel="Contemporary"
          />
        </div>
      </section>

      <section id="discover" className="border-y border-[#d8d8d8] bg-[#faf8f6] px-5 py-20 sm:px-12 sm:py-32">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-16">
          <div className="flex max-w-[672px] flex-col gap-6 text-center">
            <h2 className="font-display text-4xl font-normal leading-[40px] text-black">Discover your next piece.</h2>
            <p className="text-lg leading-[29px] text-[#333]">
              Based on what you play, master, and favorite. The Daily Mix brings you personalized sheet music
              recommendations to expand your repertoire.
            </p>
          </div>

          <div className="w-full rounded-xl border border-[#d8d8d8] bg-[#f4f1ea] p-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-xl font-medium leading-7 text-black">Daily Mix</h3>
                <p className="mt-1 text-sm leading-5 text-[#a3a3a3]">Curated to your interests & skillset</p>
              </div>
              <Link href="/register" className="text-sm font-medium text-[#7c3aed] hover:underline">
                View all
              </Link>
            </div>
            <div className="-mx-2 flex gap-6 overflow-x-auto pb-4 scrollbar-thin">
              {dailyMix.map((item) => (
                <div key={item.title} className="min-w-[240px] flex-1 px-2">
                  <PieceShowcaseCard
                    title={item.title}
                    composer={item.composer}
                    statusLabel="New"
                    statusTone="new"
                    genreLabel={item.genreLabel}
                    texture={item.texture}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center gap-8 px-6 py-24 text-center sm:py-32">
        <h2 className="font-display max-w-2xl text-4xl font-normal leading-none text-black sm:text-5xl sm:leading-none">
          Ready to compose your library?
        </h2>
        <Link
          href="/register"
          className="rounded-sm bg-black px-8 py-4 text-base font-medium leading-6 text-[#faf8f6] transition-colors hover:bg-neutral-900"
        >
          Get Started for Free
        </Link>
      </section>

      <footer className="border-t border-[#d8d8d8] bg-[#faf8f6] px-5 pb-8 pt-16 sm:px-12">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-16">
          <div className="max-w-sm">
            <p className="font-display text-xl font-bold leading-7 text-black">Repertoire</p>
            <p className="mt-6 text-sm leading-5 text-[#a3a3a3]">The smart library for modern musicians.</p>
          </div>
          <div className="flex flex-col gap-6 border-t border-[#333] pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-4 text-[#a3a3a3]">© 2026 Repertoire. All rights reserved.</p>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs leading-4 text-[#a3a3a3] hover:text-neutral-700"
            >
              Instagram
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
