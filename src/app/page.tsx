
import { LandingPage } from "@/components/landing-page";
import { getPresaleData } from "@/services/presale-info-service";
import { getPresaleEndDate } from "@/services/presale-date-service";
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

// This export ensures the page is always dynamically rendered,
// fetching the latest data from the database on every request.
export const revalidate = 0;

export default async function Home() {
  // Check if wallet is connected via headers (set by wallet adapter middleware)
  const headerList = headers();
  const walletAddress = headerList.get('x-wallet-address');

  if (walletAddress) {
    redirect('/dashboard');
  }

  // Fetch live data from the server
  const [presaleData, presaleEndDate] = await Promise.all([
    getPresaleData(),
    getPresaleEndDate(),
  ]);

  return (
    <LandingPage 
      presaleEndDate={presaleEndDate}
      presaleInfo={presaleData.presaleInfo}
      isPresaleActive={presaleData.isPresaleActive}
    />
  );
}
