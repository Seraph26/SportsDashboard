import { notFound, redirect } from "next/navigation";
import { getAvailableSeasons, getTeamBySlug } from "@lib/teamData";
import { getCurrentSeasonYearForTeam } from "@lib/seasonUtils";

type PageProps = {
  params: Promise<{
    team: string;
  }>;
};

export default async function TeamPage({ params }: PageProps) {
  const { team: teamSlug } = await params;
  const team = getTeamBySlug(teamSlug);

  if (!team) {
    notFound();
  }

  const availableSeasons = await getAvailableSeasons(team);
  const preferredSeason = getCurrentSeasonYearForTeam(team);

  const targetSeason =
    availableSeasons.find((season) => season === preferredSeason) ??
    availableSeasons[0] ??
    preferredSeason;

  redirect(`/teams/${team.slug}/${targetSeason}`);
}