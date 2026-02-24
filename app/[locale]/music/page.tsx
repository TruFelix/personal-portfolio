import { Collection } from "../../components/collectionDisplay/model";

import { getTranslations } from 'next-intl/server';

import Collections from "../../components/collections";

export default async function MusicPortfolio() {
  const t = await getTranslations();
  const ts = await getTranslations("music");
  const tC = await getTranslations("characteristics");

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

  const mail = "trutschnigfelix@gmail.com";

  return (
    <div className="grid justify-items-center min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="grid w-full content-start justify-center max-w-3xl min-h-screen md:px-16 px-3 py-3 bg-white dark:bg-black">
        <div className="mt-5 mb-2 md:mx-0 mx-3">
          <h1 className="text-5xl font-black">{t("portfolio")}</h1>
          <p className="text-xl font-semibold ml-6">{t("music.music")}</p>
        </div>
        <div className="mx-4 md:mx-6 my-8">
          <span className="font-emphasis text-[24px] font-[600] leading-[1.6rem] dark:text-shadow-[0_0_9px_var(--foreground)]">
            {ts("description")}
          </span>
        </div>
        <Collections className="max-w-2xl grid gap-15 mb-6" collections={collections} />
        {/* <Image
          alt="retro tape player"
          height="502"
          width="371"
          className="max-w-100 mt-6"
          src="/Player-Mobile.svg"
          /> */}
        <div className="flex justify-center mx-4 md:mx-6 my-8">
          <span className="font-emphasis text-[24px] font-[600] leading-[1.6rem] dark:text-shadow-[0_0_9px_var(--foreground)]">
            {t("motto")}
          </span>
        </div>
      </main>
    </div>
  );
}