
export interface Category {
  id: string;
  label: string;
}

export interface SubCategory {
  id: string;
  categoryId: string;
  label: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  categoryId: string;
  subCategoryId: string;
  imageUrl: string;
  images?: string[];
  description: string;
  marqueeStrip?: 'none' | '1' | '2';
  isFullWidth?: boolean;
}

export interface StoreImage {
  id: string;
  imageUrl: string;
  caption?: string;
}

export interface Skill {
  name: string;
  percentage: number;
}

export interface ContactInfo {
  email: string;
  whatsapp: string;
  instagram: string;
  linkedin: string;
  github: string;
  profileImageUrl?: string;
  bannerUrl?: string;
}


export interface Banner {
  id: string;
  sectionId: string;       // 'home' | 'about' | 'portfolio' | categoryId
  subSectionId: string;    // 'all' | subCategoryId
  imageUrl: string;
}

export type ViewState = 'HOME' | 'ABOUT' | 'PORTFOLIO' | 'CATEGORY' | 'ADMIN';
