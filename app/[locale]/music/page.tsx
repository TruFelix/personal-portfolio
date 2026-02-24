import { Collection } from "../../components/collectionDisplay/model";

import { getI18n, getScopedI18n } from '../../../locales/server';

import { setStaticParamsLocale } from 'next-international/server';

import { getStaticParams } from '../../../locales/server';
import Collections from "../../components/collections";

export function generateStaticParams() {
  return getStaticParams()
}

export default async function MusicPortfolio({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  setStaticParamsLocale(locale);

  const t = await getI18n();
  const ts = await getScopedI18n("music");
  const tC = await getScopedI18n("characteristics");

  const collections: Collection[] = [
    {
      coverImgUrl: "/music/23_25/23_25.png",
      title: "23 : 25",
      description: t("23:25 description"),
      years: "2023-2025",
      characteristics: [tC("personal"), tC("pads"), tC("synths"), tC("loops"), tC("samples")],
      songs: [
        { title: "Lo Way", url: "/music/23_25/LoWay.mp3" },
        { title: "sampler", url: "/music/23_25/sampler.mp3" },
        { title: "BassFirst", url: "/music/23_25/BassFirst.mp3" },
      ]
    },
    {
      coverImgUrl: "/music/debris/debris.png",
      title: "debris",
      years: "2023-2026",
      characteristics: [tC("80s"), tC("lush"), tC("hollow"), tC("pads"), tC("synths"), tC("loops")],
      description: t("debris description"),
      songs: [
        { title: "ding", url: "/music/debris/ding.mp3" },
        { title: "Swirl", url: "/music/debris/Swirl.mp3" },
        { title: "Arc2 New Signals 1", url: "/music/debris/Arc2-NewSignals-1.mp3" },
        { title: "Arc2 New Signals 2", url: "/music/debris/Arc2-NewSignals-2.mp3" },
        { title: "Arc3 Fin 1", url: "/music/debris/Arc3-Fin-1.mp3" },
      ]
    }
  ];

  return (
    <div className="flex justify-center min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="grid w-full content-start justify-center max-w-3xl min-h-screen md:px-16 px-3 py-3 bg-white dark:bg-black">
        <div className="mt-5 mb-12 md:mx-0 mx-3">
          <h1 className="text-5xl font-black">{t("portfolio")}</h1>
          <p className="text-xl font-semibold ml-6">{t("music")}</p>
        </div>
        <div className="mx-4 md:mx-6 mb-6">
          {ts("description")}
        </div>
        <Collections className="max-w-2xl grid gap-15" collections={collections} />
      </main>
    </div>
  );
}