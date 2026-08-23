import { notFound } from "next/navigation";
import TeamSeasonPage from "@components/TeamSeasonPage";
import { getTeamBySlug, getTeamSeasonData } from "@lib/teamData";

type PageProps = {
  params: Promise<{
    team: string;
    year: string;
  }>;
};

export default async function TeamSeasonRoute({ params }: PageProps) {
  const { team: teamSlug, year } = await params;

  const team = getTeamBySlug(teamSlug);
  if (!team) notFound();

  const season = Number(year);
  if (!Number.isFinite(season)) notFound();

  const data = await getTeamSeasonData(team, season);

  return <TeamSeasonPage data={data} />;
}