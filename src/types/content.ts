export interface HackathonEntry {
  id: string;
  title: string;
  year: string;
  achievement: string;
  problem: string;
  team: string;
  approach: string;
  impact: string;
  certificateUrl?: string;
  videoUrl?: string;
  architectureUrl?: string;
  newsUrl?: string;
}

export interface KnowledgeNote {
  id: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  links: string[];
}

export interface FinderFolder {
  id: string;
  name: string;
  icon: string;
  type: 'folder' | 'file';
  children?: FinderFolder[];
  appId?: string;
  payload?: Record<string, unknown>;
}
