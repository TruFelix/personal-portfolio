import MusicLayout from './music/layout';
import MusicPortfolio from './music/page';

export default function Home() {
  // as long as there is nothing more than music just mirror it here
  return <MusicLayout>
    <MusicPortfolio />
  </MusicLayout>
}