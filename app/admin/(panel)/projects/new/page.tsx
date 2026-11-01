import { PageTitle } from "@/components/admin/PageTitle";
import { ProjectEditor } from "@/components/admin/ProjectEditor";

export const metadata = { title: "New project" };

export default function NewProject() {
  return (
    <>
      <PageTitle index="02 / Projects / New" title="New project" />
      <ProjectEditor
        id={null}
        initial={{ title: "", slug: "", location: "", year: new Date().getFullYear(), type: "RESIDENTIAL", status: "DRAFT", featured: false, lead: "", body: { type: "doc", content: [{ type: "paragraph" }] }, siteArea: "", floorArea: "", client: "", builder: "", photographer: "" }}
      />
      <p className="a-hint">Save the project first, then add images.</p>
    </>
  );
}
