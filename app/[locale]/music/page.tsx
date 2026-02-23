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
  const collections: Collection[] = [
    {
      coverImgUrl: "/music/23_25.jpg",
      title: "23 : 25",
      description: t("23:25 description"),
      songs: [
        { title: "BassFirst", url: "/music/BassFirst.mp3" },
        { title: "Lo Way", url: "/music/LoWay.mp3" },
      ]
    }
  ];

  return (
    <div className="flex justify-center min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="grid w-full content-start max-w-xl min-h-screen l:px-16 py-3 px-4 bg-white dark:bg-black">
        <div className="mb-12">
          <h1 className="text-5xl font-black">{t("portfolio")}</h1>
          <p className="text-xl font-semibold">{t("music")}</p>
        </div>
        <div>
          {ts("description")}
        </div>
        <Collections collections={collections} />
      </main>
    </div>
  );
}