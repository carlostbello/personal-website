export interface Project {
  id: string
  title: string
  description: string
  longDescription?: string
  image?: string
  tech: string[]
  category: 'web' | 'mobile' | 'tool' | 'other'
  links: {
    github?: string
    demo?: string
    website?: string
  }
  featured?: boolean
  date: string
}

// TODO: Replace with real projects
export const projects: Project[] = [
  {
    id: 'project-1',
    title: 'E-Commerce Platform',
    description:
      'A full-stack e-commerce solution with real-time inventory management.',
    longDescription:
      'Built a complete e-commerce platform from scratch with features including user authentication, product catalog, shopping cart, payment processing with Stripe, and admin dashboard for inventory management.',
    tech: ['Next.js', 'TypeScript', 'PostgreSQL', 'Stripe', 'Tailwind CSS'],
    category: 'web',
    links: {
      github: 'https://github.com/carlostbello',
      demo: 'https://example.com',
    },
    featured: true,
    date: '2024-01-15',
  },
  {
    id: 'project-2',
    title: 'Task Management App',
    description: 'A collaborative task management tool with real-time updates.',
    longDescription:
      'Developed a task management application that allows teams to collaborate in real-time, assign tasks, set deadlines, and track progress with visual boards and analytics.',
    tech: ['React', 'Node.js', 'Socket.io', 'MongoDB', 'Express'],
    category: 'web',
    links: {
      github: 'https://github.com/carlostbello',
    },
    featured: true,
    date: '2023-11-20',
  },
  {
    id: 'project-3',
    title: 'CLI Developer Tool',
    description:
      'A command-line tool for automating common development workflows.',
    longDescription:
      'Created a CLI tool that helps developers automate repetitive tasks, manage project templates, and streamline their development workflow with customizable scripts.',
    tech: ['Node.js', 'TypeScript', 'Commander.js', 'Inquirer'],
    category: 'tool',
    links: {
      github: 'https://github.com/carlostbello',
    },
    featured: false,
    date: '2023-09-10',
  },
]

export function getProjects(): Project[] {
  return projects
}

export function getFeaturedProjects(): Project[] {
  return projects.filter((project) => project.featured)
}

export function getProjectsByCategory(
  category: Project['category']
): Project[] {
  return projects.filter((project) => project.category === category)
}

export function getProjectById(id: string): Project | undefined {
  return projects.find((project) => project.id === id)
}
