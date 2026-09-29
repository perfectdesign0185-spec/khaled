
import { Category, SubCategory, PortfolioItem, Skill } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'SOCIAL_MEDIA', label: 'سوشيال ميديا' },
  { id: 'E_COMMERCE', label: 'متاجر إلكترونية' },
  { id: 'PRINTS', label: 'مطبوعات' },
  { id: 'VISUAL_IDENTITY', label: 'هوية بصرية' }
];

export const INITIAL_SUB_CATEGORIES: SubCategory[] = [
  { id: 'all', categoryId: 'SOCIAL_MEDIA', label: 'الكل' },
  { id: 'posts', categoryId: 'SOCIAL_MEDIA', label: 'تصاميم بوستات' },
  { id: 'ads', categoryId: 'SOCIAL_MEDIA', label: 'حملات إعلانية' },
  { id: 'motion', categoryId: 'SOCIAL_MEDIA', label: 'موشن جرافيك' },
  { id: 'all', categoryId: 'E_COMMERCE', label: 'الكل' },
  { id: 'salla', categoryId: 'E_COMMERCE', label: 'متاجر سلة' },
  { id: 'zid', categoryId: 'E_COMMERCE', label: 'متاجر زد' },
  { id: 'uiux', categoryId: 'E_COMMERCE', label: 'واجهات مستخدم' },
  { id: 'all', categoryId: 'PRINTS', label: 'الكل' },
  { id: 'profile', categoryId: 'PRINTS', label: 'بروفايل شركات' },
  { id: 'packaging', categoryId: 'PRINTS', label: 'تغليف منتجات' },
  { id: 'menus', categoryId: 'PRINTS', label: 'منيو ومطويات' },
  { id: 'all', categoryId: 'VISUAL_IDENTITY', label: 'الكل' },
  { id: 'logo', categoryId: 'VISUAL_IDENTITY', label: 'تصميم شعارات' },
  { id: 'guide', categoryId: 'VISUAL_IDENTITY', label: 'أدلة الهوية' },
  { id: 'stationery', categoryId: 'VISUAL_IDENTITY', label: 'مطبوعات الهوية' },
];

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  // Social Media
  {
    id: 'sm1',
    title: 'تصميم حملة رمضانية',
    categoryId: 'SOCIAL_MEDIA',
    subCategoryId: 'posts',
    imageUrl: 'https://picsum.photos/seed/sm1/800/800',
    images: [
      'https://picsum.photos/seed/sm1-2/800/800',
      'https://picsum.photos/seed/sm1-3/800/800'
    ],
    description: ''
  },
  {
    id: 'sm2',
    title: 'هوية بصرية لمطعم سعودي',
    categoryId: 'SOCIAL_MEDIA',
    subCategoryId: 'ads',
    imageUrl: 'https://picsum.photos/seed/sm2/800/800',
    description: ''
  },
  // E-Commerce
  {
    id: 'ec1',
    title: 'تصميم واجهة متجر سلة',
    categoryId: 'E_COMMERCE',
    subCategoryId: 'salla',
    imageUrl: 'https://picsum.photos/seed/ec1/800/800',
    description: ''
  },
  // Prints
  {
    id: 'p1',
    title: 'بروفايل شركة هندسية',
    categoryId: 'PRINTS',
    subCategoryId: 'profile',
    imageUrl: 'https://picsum.photos/seed/p1/800/800',
    description: ''
  },
  // Visual Identity
  {
    id: 'vi1',
    title: 'هوية بصرية لشركة تقنية',
    categoryId: 'VISUAL_IDENTITY',
    subCategoryId: 'logo',
    imageUrl: 'https://picsum.photos/seed/vi1/800/800',
    description: ''
  },
];

export const SKILLS: Skill[] = [
  { name: 'Adobe Photoshop', percentage: 95 },
  { name: 'Adobe Illustrator', percentage: 90 },
  { name: 'Adobe InDesign', percentage: 85 },
  { name: 'UI/UX Design', percentage: 80 },
  { name: 'E-commerce Management', percentage: 75 }
];
