import type { Metadata } from 'next'
import {
  User,
  Code,
  Lightbulb,
  Heart,
  Globe,
  Brain,
  Shield,
  Rocket,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn more about Carlos Bello - Software Engineer, Maker, and lifelong learner.',
}

export default function AboutPage() {
  return (
    <div className="container px-4 py-16">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          About Me
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Building smarter systems, from enterprise AI architectures to recycled
          homelabs. I am an engineer who solves hard problems with code, whether
          it is for a major organization or my espresso machine.
        </p>
      </section>

      {/* Story Section */}
      <section className="mb-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              The Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <Brain className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="leading-none font-medium">The Philosophy</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  I operate at the intersection of innovation and reliability.
                  My work involves pioneering AI strategies and delivering
                  scalable solutions for large enterprise clients. I enjoy being
                  hands-on with the code while also guiding technical strategy
                  from concept to deployment.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                <Shield className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="leading-none font-medium">The Specialization</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  A lot of my recent focus has been on AI Security and
                  disconnected environments. I specialize in architecting RAG
                  pipelines and intelligent systems where standard cloud
                  solutions are not an option. I also love sharing this
                  knowledge by speaking at cybersecurity conferences about the
                  operational realities of AI.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                <Rocket className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="leading-none font-medium">The Drive</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  But for me, software is not just a career. It is a genuine
                  obsession. I believe the best engineers are &quot;Makers&quot;
                  at heart. That curiosity does not turn off when I clock out.
                  It just shifts focus to the next project in the lab.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Skills Grid */}
      <section className="mb-16">
        <h2 className="mb-8 text-3xl font-bold">Tech Stack</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* AI & LLMs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-cyan-500" />
                AI & Intelligent Systems
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground space-y-2">
                <li>RAG & Agentic Workflows</li>
                <li>LangChain & LlamaIndex</li>
                <li>vLLM & Milvus</li>
                <li>PyTorch & Prompt Eng</li>
              </ul>
            </CardContent>
          </Card>

          {/* Backend/Systems */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-green-500" />
                Systems & Infra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground space-y-2">
                <li>Python & GoLang</li>
                <li>Kubernetes & Docker</li>
                <li>Apache Kafka</li>
                <li>Serverless Architecture</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data & Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Data & Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground space-y-2">
                <li>PostgreSQL & SQL</li>
                <li>OpenSearch & Dash</li>
                <li>ETL Pipelines</li>
                <li>Data Visualization</li>
              </ul>
            </CardContent>
          </Card>

          {/* Web & Frontend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-500" />
                Web & Frontend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground space-y-2">
                <li>Next.js & React</li>
                <li>TypeScript</li>
                <li>Tailwind CSS</li>
                <li>Supabase & Vercel</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Interests/Passions */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              The Lab (Passions)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">The Homelab</h3>
                <p className="text-muted-foreground text-sm">
                  I build servers from recycled computers. It is my personal
                  playground for testing distributed systems and breaking things
                  safely.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">The Maker Mindset</h3>
                <p className="text-muted-foreground text-sm">
                  Bridging code and the physical world through 3D printing,
                  circuit building, and hardware integration.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Smart Coffee</h3>
                <p className="text-muted-foreground text-sm">
                  Yes, I modded my espresso machine with an Arduino. Because if
                  you cannot graph your extraction pressure, are you even
                  caffeinated?
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Music & Audio</h3>
                <p className="text-muted-foreground text-sm">
                  I collect guitars, basses, and recording gear. I love the
                  technical side of audio production just as much as playing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
