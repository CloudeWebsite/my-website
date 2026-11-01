import { Hero } from "@/components/hero/Hero";
import { Approach } from "@/components/home/Approach";
import { ContactCta } from "@/components/home/ContactCta";
import { FeaturedProject } from "@/components/home/FeaturedProject";
import { Features } from "@/components/home/Features";
import { Intro } from "@/components/home/Intro";
import { Journal } from "@/components/home/Journal";
import { ProjectsIndex } from "@/components/home/ProjectsIndex";
import { Services } from "@/components/home/Services";
import { Studio } from "@/components/home/Studio";
import { Testimonials } from "@/components/home/Testimonials";
import { countProjects, getFeaturedProject, getPosts, getProjects, getServices, getTeam, getTestimonials } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const revalidate = 300;

export default async function HomePage() {
  const [settings, featured, projects, total, services, team, testimonials, posts] = await Promise.all([
    getSettings(),
    getFeaturedProject(),
    getProjects(undefined, 8),
    countProjects(),
    getServices(),
    getTeam(),
    getTestimonials(),
    getPosts(3),
  ]);
  return (
    <>
      <Hero hero={settings.hero} />
      <Intro stats={settings.stats} since={settings.studio.foundedYear} />
      <Features />
      <FeaturedProject project={featured} />
      <ProjectsIndex initial={projects} total={total} />
      <Services services={services} />
      <Approach />
      <Studio team={team} studioName={settings.studio.name} />
      <Testimonials items={testimonials} />
      <Journal posts={posts} />
      <ContactCta studio={settings.studio} />
    </>
  );
}
