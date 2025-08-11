
import { LandingPage } from "@/components/landing-page";
import { getPresaleData } from "@/services/presale-info-service";
import { getPresaleEndDate } from "@/services/presale-date-service";

export default async function Home() {

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
