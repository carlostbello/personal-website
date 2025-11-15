import { ExternalLink, Github } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getPublishedProjects, type ProjectWithTags } from '@/lib/supabase'

const categories = [
  { id: 'all', label: 'All Projects' },
  { id: 'web', label: 'Web Apps' },
  { id: 'mobile', label: 'Mobile Apps' },
  { id: 'tool', label: 'Dev Tools' },
  { id: 'other', label: 'Other' },
] as const

export default async function ProjectsPage() {
  const projects = await getPublishedProjects()

  return (
    <div className="container px-4 py-16">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Projects
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          A collection of projects I&apos;ve worked on. From web applications to
          developer tools, each project represents a unique challenge and
          learning opportunity.
        </p>
      </section>

      {/* Projects Grid */}
      <section>
        {projects.length === 0 ? (
          <div className="text-muted-foreground py-16 text-center">
            <p>No projects found.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ProjectCard({ project }: { project: ProjectWithTags }) {
  return (
    <Card className="group transition-all hover:shadow-lg hover:shadow-cyan-500/10">
      <CardHeader>
        <div className="mb-2 flex items-start justify-between">
          <CardTitle className="text-xl">{project.title}</CardTitle>
          {project.featured && (
            <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-500">
              Featured
            </span>
          )}
        </div>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Tech Stack */}
        <div className="mb-4 flex flex-wrap gap-2">
          {project.tech.map((tech) => (
            <span
              key={tech}
              className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Links */}
        <div className="flex gap-2">
          {project.github_url && (
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                Code
              </a>
            </Button>
          )}
          {project.demo_url && (
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a
                href={project.demo_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Demo
              </a>
            </Button>
          )}
          {project.website_url && (
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a
                href={project.website_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
