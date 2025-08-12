
import { LandingPage } from "@/components/landing-page";
import { getPresaleData } from "@/services/presale-info-service";
import { getPresaleEndDate } from "@/services/presale-date-service";

// This export ensures the page is always dynamically rendered,
// fetching the latest data from the database on every request.
export const revalidate = 0;

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
