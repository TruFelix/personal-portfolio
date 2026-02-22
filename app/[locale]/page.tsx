import CollectionDisplay from "../components/collectionDisplay/collectionDisplay";
import { Collection } from "../components/collectionDisplay/model";

import { getI18n } from '../../locales/server';

import { setStaticParamsLocale } from 'next-international/server';

import { getStaticParams } from '../../locales/server';

export function generateStaticParams() {
  return getStaticParams()
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  setStaticParamsLocale(locale);

  const t = await getI18n();
  const collections: Collection[] = [
    {
      coverImgUrl: "./music/2325.jpg",
      title: "23 : 25",
      description: <>{t("23:25 description")}</>,
      songs: [
        { title: "BassFirst", url: "./music/BassFirst.mp3" }
      ]
    }
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        {collections.map(collection => <CollectionDisplay key={collection.title} collection={collection} />)}
      </main>
    </div>
  );
}
