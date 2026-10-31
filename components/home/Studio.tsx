import Image from "next/image";
import type { TeamMember } from "@prisma/client";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Marks } from "@/components/ui/Marks";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

export function Studio({ team, studioName, index = "05" }: { team: TeamMember[]; studioName: string; index?: string }) {
  return (
    <section className="section studio" data-theme="light" id="studio">
      <div className="wrap grid">
        <div className="studio__photo" data-parallax="0.12" data-cursor="view">
          <Image src="/renders/studio-model.jpg" alt="Working model of a courtyard house on the studio table" width={1600} height={2000} sizes="(max-width: 900px) 100vw, 45vw" />
          <Marks note="Studio model · 1:50" />
        </div>
        <div className="studio__text">
          <SectionLabel index={index}>Studio</SectionLabel>
          <h2 className="t-h2" data-reveal="lines">
            A small team, <em>at one long table</em>
          </h2>
          <div className="studio__story" data-reveal="fade">
            <p>
              {studioName} is a practice of architects, interior designers and model-makers. We take on a handful of houses each year so that the people
              who draw your home are the people who visit its site, meet its builder and walk it with you on the day you move in.
            </p>
            <p>We draw by hand before we draw by machine, build models before renderings, and measure success by how a house feels in its twentieth winter.</p>
          </div>
          <ul className="team" data-reveal="stagger">
            {team.map((m) => (
              <li key={m.id} className="team__m">
                <span className="team__photo">
                  {m.photoUrl ? (
                    <Image src={m.photoUrl} alt={`Portrait of ${m.name}`} width={400} height={500} sizes="(max-width: 600px) 50vw, 200px" />
                  ) : (
                    <span className="team__ph" aria-hidden="true">
                      <span className="team__ini">{initials(m.name)}</span>
                      <span className="t-mono team__phnote">Portrait — placeholder</span>
                    </span>
                  )}
                </span>
                <span className="team__name">{m.name}</span>
                <span className="t-mono team__role">{m.role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
