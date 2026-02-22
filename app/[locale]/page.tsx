


import { getStaticParams } from '../../locales/server';
import MusicPortfolio from './music/page';

export function generateStaticParams() {
  return getStaticParams()
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  // as long as there is nothing more than music just mirror it here
  return <MusicPortfolio params={params}/>
}