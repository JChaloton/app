import { ProjectBomForm } from "@/components/project-bom-form";
import { SavedProjectsTable } from "@/components/saved-projects-table";
import { getProjects } from "@/lib/data";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Projects</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          BOM Pre-flight & Commit
        </h1>
        <p className="mt-2 max-w-3xl text-base text-slate-600">
          Analyze BOM cost from your latest prices, check shortages, and commit deductions even if
          inventory must go negative.
        </p>
      </div>

      <ProjectBomForm
        projects={projects.map((project) => ({
          id: project.id,
          name: project.name,
          buildQuantity: project.buildQuantity,
        }))}
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">Saved Project Totals</h2>
        <SavedProjectsTable projects={projects} />
      </section>
    </div>
  );
}
