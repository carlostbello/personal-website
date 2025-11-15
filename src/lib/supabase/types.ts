export interface Project {
  id: string
  title: string
  slug: string
  description: string | null
  long_description: string | null
  image_url: string | null
  tech: string[]
  category: 'web' | 'mobile' | 'tool' | 'other' | null
  github_url: string | null
  demo_url: string | null
  website_url: string | null
  featured: boolean
  published: boolean
  source_path: string | null // Obsidian vault file path
  last_synced_at: string | null // Last sync from Obsidian
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  author: string
  published: boolean
  published_at: string | null
  source_path: string | null // Obsidian vault file path
  last_synced_at: string | null // Last sync from Obsidian
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface ProjectWithTags extends Project {
  tags: Tag[]
}

export interface BlogPostWithTags extends BlogPost {
  tags: Tag[]
}
