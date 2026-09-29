
import React, { useState, useEffect, useMemo } from 'react';
import {
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  CheckCircle,
  ExternalLink,
  Smartphone,
  Layout,
  Printer,
  ChevronDown,
  Github,
  Award,
  ArrowRight,
  ArrowLeft,
  Home,
  User,
  Briefcase,
  Palette,
  Sparkles,
  Settings,
  Plus,
  Trash2,
  BarChart3,
  Lock,
  LogOut,
  Save,
  Image as ImageIcon,
  X,
  Maximize2,
  Filter,
  Monitor,
  Store,
  HelpCircle,
  Edit2,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';
import { Category, SubCategory, ViewState, PortfolioItem, ContactInfo, StoreImage, Skill, Banner } from './types';
import { PORTFOLIO_ITEMS as INITIAL_ITEMS, SKILLS, INITIAL_CATEGORIES, INITIAL_SUB_CATEGORIES } from './constants';
import { supabase } from './supabaseClient';
import * as db from './supabase-db';

// Global memory cache for preloaded images
const preloadedImagesCache = new Set<string>();

/**
 * Preloads an image into browser cache in the background.
 */
const preloadImage = (url?: string) => {
  if (!url || preloadedImagesCache.has(url)) return;
  preloadedImagesCache.add(url);
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
};

/**
 * Helper to convert Google Drive sharing links to high-quality Direct Image URLs.
 * Uses the uc?export=view endpoint which is more reliable for embedding public images.
 */
const getDirectImageUrl = (url: string): string => {
  if (!url) return "";

  // Robust regex for various Drive link formats
  const driveIdRegex = /(?:\/file\/d\/|id=|open\?id=)([a-zA-Z0-9_-]{25,})/;
  const match = url.match(driveIdRegex);

  if (url.includes("drive.google.com") && match && match[1]) {
    // Newest Google Drive direct image embed format using lh3 infrastructure, completely bypasses limits and CORS
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }

  return url.trim();
};

/**
 * Helper to append sizing & WebP format parameter to Google Drive direct images for lightning fast performance.
 */
const getRenderImageUrl = (url: string, size?: number): string => {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.includes("lh3.googleusercontent.com/d/")) {
    const baseUrl = trimmed.split('=')[0];
    const targetSize = size || 1600;
    // -rw tells Google CDN to serve lightweight, modern WebP format (up to 70% faster)
    return `${baseUrl}=w${targetSize}-rw`;
  }
  return trimmed;
};

const ImageWithFallback: React.FC<{
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
}> = ({ src, alt, className = '', loading = 'lazy', fetchPriority }) => {
  const [error, setError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(() => preloadedImagesCache.has(src));

  useEffect(() => {
    if (preloadedImagesCache.has(src)) {
      setIsLoaded(true);
      setError(false);
    } else {
      setIsLoaded(false);
      setError(false);
    }
  }, [src]);

  if (error || !src) {
    return (
      <div className={`${className} bg-zinc-900 flex flex-col items-center justify-center text-zinc-700 gap-2 border border-zinc-800`}>
        <AlertTriangle size={24} className="opacity-50" />
        <span className="text-[10px] font-bold">خطأ في التحميل</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-zinc-900/60 animate-pulse flex items-center justify-center z-0" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onError={() => setError(true)}
        onLoad={() => {
          setIsLoaded(true);
          preloadedImagesCache.add(src);
        }}
        loading={loading}
        decoding="async"
        {...(fetchPriority ? { fetchPriority } : {})}
      />
    </div>
  );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [subCategories, setSubCategories] = useState<SubCategory[]>(INITIAL_SUB_CATEGORIES);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(INITIAL_CATEGORIES[0]?.id || '');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>('all');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lightbox State
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const openLightbox = (images: string[], index: number = 0) => {
    setCarouselImages(images);
    setCarouselIndex(index);
    // Immediately prefetch all images in the carousel for instant browsing
    images.forEach(img => preloadImage(getRenderImageUrl(img, 1600)));
  };

  const closeLightbox = () => {
    setCarouselImages([]);
    setCarouselIndex(0);
  };

  // Preload adjacent images & handle keyboard controls (Esc, Arrow Left, Arrow Right)
  useEffect(() => {
    if (carouselImages.length === 0) return;

    const curr = carouselImages[carouselIndex];
    const next = carouselImages[(carouselIndex + 1) % carouselImages.length];
    const prev = carouselImages[(carouselIndex - 1 + carouselImages.length) % carouselImages.length];
    if (curr) preloadImage(getRenderImageUrl(curr, 1600));
    if (next) preloadImage(getRenderImageUrl(next, 1600));
    if (prev) preloadImage(getRenderImageUrl(prev, 1600));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        setCarouselIndex(p => (p === 0 ? carouselImages.length - 1 : p - 1));
      } else if (e.key === 'ArrowRight') {
        setCarouselIndex(p => (p === carouselImages.length - 1 ? 0 : p + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carouselImages, carouselIndex]);

  // Admin State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [visitorCount, setVisitorCount] = useState(0);
  const [editingStoreImage, setEditingStoreImage] = useState<string | null>(null);
  const [editingPortfolioItem, setEditingPortfolioItem] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Banners State
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerSectionId, setBannerSectionId] = useState<string>('home');
  const [bannerSubSectionId, setBannerSubSectionId] = useState<string>('all');
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string>('');

  // Dynamic Content State
  const [items, setItems] = useState<PortfolioItem[]>(INITIAL_ITEMS);
  const [storeImages, setStoreImages] = useState<StoreImage[]>([]);
  const [contact, setContact] = useState<ContactInfo>({
    email: 'khaled.omar@example.com',
    whatsapp: '+201234567890',
    instagram: '#',
    linkedin: '#',
    github: '#',
    profileImageUrl: 'https://picsum.photos/seed/khaled2/600/600',
    bannerUrl: ''
  });
  const [skills, setSkills] = useState<Skill[]>(SKILLS);

  // Fetch all data from Supabase on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [catsRes, subsRes, itemsRes, storeRes, skillsRes, contactRes, bannersRes] = await Promise.allSettled([
          db.fetchCategories(),
          db.fetchSubCategories(),
          db.fetchPortfolioItems(),
          db.fetchStoreImages(),
          db.fetchSkills(),
          db.fetchContactInfo(),
          db.fetchBanners(),
        ]);
        if (catsRes.status === 'fulfilled' && catsRes.value.length > 0) {
          setCategories(catsRes.value);
          setSelectedCategoryId(catsRes.value[0].id);
        }
        if (subsRes.status === 'fulfilled' && subsRes.value.length > 0) setSubCategories(subsRes.value);
        if (itemsRes.status === 'fulfilled' && itemsRes.value.length > 0) setItems(itemsRes.value);
        if (storeRes.status === 'fulfilled') setStoreImages(storeRes.value);
        if (skillsRes.status === 'fulfilled' && skillsRes.value.length > 0) setSkills(skillsRes.value);
        if (contactRes.status === 'fulfilled' && contactRes.value) setContact(contactRes.value);
        if (bannersRes.status === 'fulfilled' && bannersRes.value && bannersRes.value.length > 0) setBanners(bannersRes.value);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Visitor count
  useEffect(() => {
    db.incrementVisitorCount().then(count => setVisitorCount(count)).catch(console.error);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView, selectedCategoryId, selectedSubCategoryId]);

  const handleMainCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId);
    setSelectedSubCategoryId('all');
  };

  const navigateToCategory = (catId: string) => {
    handleMainCategoryChange(catId);
    setCurrentView('CATEGORY');
  };

  // Banner Helper: find the best-matching banner for a given section
  const getBannerForSection = (sectionId: string, subSectionId: string = 'all'): Banner | undefined => {
    // First try sub-section specific banner
    if (subSectionId && subSectionId !== 'all') {
      const subBanner = banners.find(b => b.sectionId === sectionId && b.subSectionId === subSectionId);
      if (subBanner) return subBanner;
    }
    // Then try section-level banner
    return banners.find(b => b.sectionId === sectionId && b.subSectionId === 'all');
  };

  // Banner CRUD
  const addBanner = async (imageUrl: string) => {
    if (!imageUrl) {
      alert('الرجاء اختيار صورة أو لصق رابط');
      return;
    }
    // Check if a banner already exists for this section+sub
    const existing = banners.find(b => b.sectionId === bannerSectionId && b.subSectionId === bannerSubSectionId);
    if (existing) {
      try {
        await db.updateBannerDB(existing.id, imageUrl);
        setBanners(prev => prev.map(b => b.id === existing.id ? { ...b, imageUrl } : b));
        alert('تم تحديث البنر بنجاح');
      } catch (err: any) {
        alert('خطأ: ' + (err.message || 'فشل في التحديث'));
      }
    } else {
      const newBanner: Banner = {
        id: Date.now().toString(),
        sectionId: bannerSectionId,
        subSectionId: bannerSubSectionId,
        imageUrl,
      };
      try {
        await db.insertBanner(newBanner);
        setBanners(prev => [newBanner, ...prev]);
        alert('تم إضافة البنر بنجاح');
      } catch (err: any) {
        alert('خطأ: ' + (err.message || 'فشل في الإضافة'));
      }
    }
    setBannerPreviewUrl('');
    const fileInput = document.getElementById('banner-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    const urlInput = document.getElementById('banner-url-input') as HTMLInputElement;
    if (urlInput) urlInput.value = '';
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا البنر؟')) return;
    try {
      await db.removeBanner(id);
      setBanners(prev => prev.filter(b => b.id !== id));
    } catch (err: any) {
      alert('خطأ: ' + (err.message || 'فشل في الحذف'));
    }
  };

  // Section label helper
  const getSectionLabel = (sectionId: string): string => {
    if (sectionId === 'home') return 'الرئيسية';
    if (sectionId === 'about') return 'نبذة عني';
    if (sectionId === 'portfolio') return 'معرض الأعمال';
    return categories.find(c => c.id === sectionId)?.label || sectionId;
  };

  const getSubSectionLabel = (sectionId: string, subSectionId: string): string => {
    if (subSectionId === 'all') return 'الكل';
    return subCategories.find(s => s.id === subSectionId && s.categoryId === sectionId)?.label || subSectionId;
  };

  // Full-width Banner component
  const FullWidthBanner = ({ sectionId, subSectionId = 'all' }: { sectionId: string; subSectionId?: string }) => {
    const banner = getBannerForSection(sectionId, subSectionId);
    if (!banner) return null;
    return (
      <div className="w-full overflow-hidden shadow-2xl shadow-amber-500/5 mb-8">
        <img
          src={getRenderImageUrl(banner.imageUrl, 1920)}
          alt="بنر"
          className="w-full h-auto object-cover"
          style={{ maxHeight: '700px' }}
          loading={sectionId === 'home' ? 'eager' : 'lazy'}
          {...(sectionId === 'home' ? { fetchPriority: 'high' } : {})}
        />
      </div>
    );
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCategory = item.categoryId === selectedCategoryId;
      const matchSub = selectedSubCategoryId === 'all' || item.subCategoryId === selectedSubCategoryId;
      return matchCategory && matchSub;
    });
  }, [selectedCategoryId, selectedSubCategoryId, items]);

  const strip1Items = useMemo(() => {
    const portfolioFiltered = items.filter(item => item.marqueeStrip === '1');
    const customBanners = banners.filter(b => b.sectionId === 'marquee1').map(b => ({
      id: b.id,
      imageUrl: b.imageUrl,
      images: [] as string[]
    }));
    const combined = [...customBanners, ...portfolioFiltered] as any[];

    const source = combined.length > 0 ? combined : (items.length > 0 ? items.slice(0, 5) : INITIAL_ITEMS.slice(0, 5));
    return [...source, ...source, ...source, ...source];
  }, [items, banners]);

  const strip2Items = useMemo(() => {
    const portfolioFiltered = items.filter(item => item.marqueeStrip === '2');
    const customBanners = banners.filter(b => b.sectionId === 'marquee2').map(b => ({
      id: b.id,
      imageUrl: b.imageUrl,
      images: [] as string[]
    }));
    const combined = [...customBanners, ...portfolioFiltered] as any[];

    const source = combined.length > 0 ? combined : (items.length > 0 ? items.slice(Math.max(0, items.length - 5)) : INITIAL_ITEMS.slice(0, 5));
    return [...source, ...source, ...source, ...source];
  }, [items, banners]);

  // Admin Actions
  const handleLogin = async () => {
    if (passwordInput === '303103') {
      setIsLoggedIn(true);
      setShowLoginModal(false);
      setCurrentView('ADMIN');
      setPasswordInput("");
      setAdminEmail("");
      alert("تم تسجيل الدخول بنجاح كمسؤول");
    } else {
      alert("كلمة المرور غير صحيحة");
    }
  };

  const addItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const mainImageFile = formData.get('imageFile') as File;
    if (!mainImageFile || mainImageFile.size === 0) {
      alert("الرجاء اختيار صورة صحيحة");
      return;
    }

    try {
      alert("جاري رفع التصميم... يرجى الانتظار ولاتغلق الصفحة.");
      const finalUrl = await db.uploadImage(mainImageFile, 'portfolio');

      const additionalImageFiles = formData.getAll('additionalImageFiles') as File[];
      const additionalImages: string[] = [];
      for (const file of additionalImageFiles) {
        if (file && file.size > 0) {
          const url = await db.uploadImage(file, 'portfolio');
          additionalImages.push(url);
        }
      }

      const newItem: PortfolioItem = {
        id: Date.now().toString(),
        title: formData.get('title') as string || 'بدون عنوان',
        imageUrl: finalUrl,
        images: additionalImages,
        description: formData.get('description') as string || '',
        categoryId: formData.get('categoryId') as string,
        subCategoryId: formData.get('subCategoryId') as string,
        marqueeStrip: formData.get('marqueeStrip') as 'none' | '1' | '2',
        isFullWidth: formData.get('isFullWidth') === 'on',
      };

      await db.insertPortfolioItem(newItem);
      setItems(prev => [newItem, ...prev]);
      form.reset();
      setPreviewUrl("");
      alert("تم إضافة العمل بنجاح");
    } catch (err: any) {
      alert("خطأ: " + (err.message || "فشل في الإضافة أو الرفع"));
    }
  };

  const addStoreImage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const mainImageFile = formData.get('imageFile') as File;

    if (!mainImageFile || mainImageFile.size === 0) {
      alert("الرجاء اختيار صورة");
      return;
    }

    try {
      alert("جاري رفع الصورة... يرجى الانتظار.");
      const finalUrl = await db.uploadImage(mainImageFile, 'store');

      const newImg: StoreImage = {
        id: Date.now().toString(),
        imageUrl: finalUrl,
        caption: formData.get('caption') as string || '',
      };

      await db.insertStoreImage(newImg);
      setStoreImages(prev => [newImg, ...prev]);
      form.reset();
      setPreviewUrl("");
      alert("تم إضافة صورة المحل بنجاح");
    } catch (err: any) {
      alert("خطأ: " + (err.message || "فشل في الإضافة أو الرفع"));
    }
  };

  const updateStoreImage = async (id: string, newUrl: string, newCaption: string) => {
    const finalUrl = getDirectImageUrl(newUrl);
    try {
      await db.updateStoreImageDB(id, finalUrl, newCaption);
      setStoreImages(prev => prev.map(img =>
        img.id === id ? { ...img, imageUrl: finalUrl, caption: newCaption } : img
      ));
      setEditingStoreImage(null);
      alert("تم تحديث الصورة");
    } catch (err: any) {
      alert("خطأ: " + (err.message || "فشل في التحديث"));
    }
  };

  const updatePortfolioItem = async (id: string, updates: Partial<PortfolioItem>) => {
    try {
      await db.updatePortfolioItemDB(id, updates);
      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ));
      setEditingPortfolioItem(null);
      alert("تم تحديث العمل بنجاح");
    } catch (err: any) {
      alert("خطأ: " + (err.message || "فشل في التحديث"));
    }
  };

  const deleteStoreImage = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه الصورة؟")) {
      try {
        await db.removeStoreImage(id);
        setStoreImages(prev => prev.filter(img => img.id !== id));
      } catch (err: any) {
        alert("خطأ: " + (err.message || "فشل في الحذف"));
      }
    }
  };

  const deleteItem = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا العمل نهائياً؟")) {
      try {
        await db.removePortfolioItem(id);
        setItems(prev => prev.filter(i => i.id !== id));
        alert("تم حذف العمل بنجاح");
      } catch (err: any) {
        alert("خطأ: " + (err.message || "فشل في الحذف"));
      }
    }
  };

  const addSkill = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const percentage = parseInt(formData.get('percentage') as string);
    if (!name || isNaN(percentage)) return;

    try {
      await db.insertSkill({ name, percentage });
      setSkills(prev => [...prev, { name, percentage }]);
      form.reset();
    } catch (err: any) {
      alert("خطأ: " + (err.message || "فشل في الإضافة"));
    }
  };

  const deleteSkill = async (name: string) => {
    if (confirm("هل أنت متأكد من حذف هذه المهارة؟")) {
      try {
        await db.removeSkillDB(name);
        setSkills(prev => prev.filter(s => s.name !== name));
      } catch (err: any) {
        alert("خطأ: " + (err.message || "فشل في الحذف"));
      }
    }
  };

  const saveContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      let finalProfileUrl = getDirectImageUrl(formData.get('profileImageUrl') as string);

      const file = formData.get('profileImageFile') as File;
      if (file && file.size > 0) {
        alert("جاري رفع الصورة الشخصية... يرجى الانتظار.");
        finalProfileUrl = await db.uploadImage(file, 'contact');
      }

      const newContact: ContactInfo = {
        email: formData.get('email') as string,
        whatsapp: formData.get('whatsapp') as string,
        instagram: formData.get('instagram') as string,
        linkedin: formData.get('linkedin') as string,
        github: formData.get('github') as string,
        profileImageUrl: finalProfileUrl,
        bannerUrl: getDirectImageUrl(formData.get('bannerUrl') as string),
      };

      await db.saveContactInfoDB(newContact);
      setContact(newContact);

      const inputURL = document.getElementById('admin-profile-img') as HTMLInputElement;
      if (inputURL) inputURL.value = finalProfileUrl;
      const inputFile = document.getElementById('admin-profile-file') as HTMLInputElement;
      if (inputFile) inputFile.value = '';

      alert("تم تحديث بيانات التواصل والصورة الشخصية بنجاح");
    } catch (err: any) {
      alert("خطأ: " + (err.message || "فشل في الحفظ"));
    }
  };

  const addCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const label = formData.get('label') as string;
    if (!label) return;
    const newCat: Category = { id: Date.now().toString(), label };
    const newSub: SubCategory = { id: 'all', categoryId: newCat.id, label: 'الكل' };
    try {
      await db.insertCategory(newCat);
      await db.insertSubCategory(newSub);
      setCategories(prev => [...prev, newCat]);
      setSubCategories(prev => [...prev, newSub]);
      form.reset();
      alert("تم إضافة القسم بنجاح");
    } catch (err: any) {
      alert("خطأ: " + (err.message || "فشل في الإضافة"));
    }
  };

  const deleteCategory = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع الأقسام الفرعية والأعمال المرتبطة به.")) {
      try {
        await db.removePortfolioItemsByCategoryId(id);
        await db.removeSubCategoriesByCategoryId(id);
        await db.removeCategory(id);

        const nextCats = categories.filter(c => c.id !== id);
        setCategories(nextCats);
        setSubCategories(prev => prev.filter(s => s.categoryId !== id));
        setItems(prev => prev.filter(i => i.categoryId !== id));

        if (selectedCategoryId === id) {
          if (nextCats.length > 0) setSelectedCategoryId(nextCats[0].id);
          else setSelectedCategoryId('');
        }
      } catch (err: any) {
        alert("خطأ: " + (err.message || "فشل في الحذف"));
      }
    }
  };

  const addSubCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const label = formData.get('label') as string;
    const categoryId = formData.get('categoryId') as string;
    if (!label || !categoryId) return;
    const newSub: SubCategory = { id: Date.now().toString(), categoryId, label };
    try {
      await db.insertSubCategory(newSub);
      setSubCategories(prev => [...prev, newSub]);
      form.reset();
      alert("تم إضافة القسم الفرعي بنجاح");
    } catch (err: any) {
      alert("خطأ: " + (err.message || "فشل في الإضافة"));
    }
  };

  const deleteSubCategory = async (id: string, categoryId: string) => {
    if (id === 'all') {
      alert("لا يمكن حذف قسم 'الكل' الافتراضي");
      return;
    }
    if (confirm("هل أنت متأكد من حذف هذا القسم الفرعي؟ سيتم حذف جميع الأعمال المرتبطة به في هذا القسم فقط.")) {
      try {
        await db.removePortfolioItemsBySubCategory(id, categoryId);
        await db.removeSubCategory(id, categoryId);
        setSubCategories(prev => prev.filter(s => !(s.id === id && s.categoryId === categoryId)));
        setItems(prev => prev.filter(i => !(i.subCategoryId === id && i.categoryId === categoryId)));
        if (selectedSubCategoryId === id) setSelectedSubCategoryId('all');
      } catch (err: any) {
        alert("خطأ: " + (err.message || "فشل في الحذف"));
      }
    }
  };

  const SubCategoryPills = () => (
    <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-6 md:mb-10">
      {subCategories.filter(s => s.categoryId === selectedCategoryId).map(sub => (
        <button
          key={`${sub.categoryId}-${sub.id}`}
          onClick={() => setSelectedSubCategoryId(sub.id)}
          className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all border ${selectedSubCategoryId === sub.id
            ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-lg shadow-amber-500/5'
            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
        >
          {sub.label}
        </button>
      ))}
    </div>
  );

  const PortfolioGrid = ({ items }: { items: PortfolioItem[] }) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
        {items.length > 0 ? items.map((item) => (
          <div
            key={item.id}
            onMouseEnter={() => {
              preloadImage(getRenderImageUrl(item.imageUrl, 1600));
              if (item.images && item.images.length > 0) {
                item.images.forEach(img => preloadImage(getRenderImageUrl(img, 1600)));
              }
            }}
            onClick={() => {
              const allImages = [item.imageUrl, ...(item.images || [])];
              openLightbox(allImages);
            }}
            className={`group relative bg-zinc-900 rounded-xl md:rounded-2xl overflow-hidden portfolio-card border border-zinc-800 cursor-pointer shadow-xl transition-all duration-300 ${item.isFullWidth ? 'col-span-2 lg:col-span-3' : ''}`}
          >
            <ImageWithFallback
              src={getRenderImageUrl(item.imageUrl, item.isFullWidth ? 1600 : 800)}
              alt={item.title}
              className="w-full h-auto block"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-full text-white flex items-center gap-2">
                <Maximize2 size={24} />
                {item.images && item.images.length > 0 && (
                  <span className="text-xs font-bold bg-amber-500 text-zinc-950 px-2 py-1 rounded-full">
                    +{item.images.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center text-zinc-600">
            <Filter className="mx-auto mb-4 opacity-20" size={48} />
            <p>لا توجد أعمال في هذا القسم حالياً</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen selection:bg-amber-400/30 selection:text-amber-400 flex flex-col">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-zinc-950/80 backdrop-blur-md py-3 md:py-4 border-b border-zinc-800' : 'bg-transparent py-4 md:py-6'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button onClick={() => setCurrentView('HOME')} className="text-xl md:text-2xl font-black gradient-text tracking-tighter cursor-pointer">
            خالد عمر
          </button>
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-reverse space-x-8 items-center text-sm font-medium">
            <button onClick={() => setCurrentView('HOME')} className={`hover:text-amber-400 transition-colors ${currentView === 'HOME' ? 'text-amber-400' : ''}`}>الرئيسية</button>
            <button onClick={() => setCurrentView('ABOUT')} className={`hover:text-amber-400 transition-colors ${currentView === 'ABOUT' ? 'text-amber-400' : ''}`}>السيرة الذاتية</button>
            <button onClick={() => setCurrentView('PORTFOLIO')} className={`hover:text-amber-400 transition-colors ${currentView === 'PORTFOLIO' ? 'text-amber-400' : ''}`}>معرض أعمالي</button>
            <div className="h-4 w-px bg-zinc-800"></div>
            {isLoggedIn && (
              <button onClick={() => setCurrentView('ADMIN')} className="text-amber-500 flex items-center gap-2 font-bold">
                <Settings size={16} /> لوحة التحكم
              </button>
            )}
            <button onClick={() => {
              const el = document.getElementById('contact');
              el?.scrollIntoView({ behavior: 'smooth' });
            }} className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-zinc-300 px-5 py-2 rounded-full font-bold transition-all">
              تواصل معي
            </button>
          </div>
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-300 hover:text-amber-400 transition-colors"
            aria-label="فتح القائمة"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-zinc-950/98 backdrop-blur-xl border-b border-zinc-800 shadow-2xl shadow-black/50" style={{ animation: 'fadeInUp 0.25s ease-out forwards' }}>
            <div className="flex flex-col items-center gap-1 py-6 px-6">
              <button onClick={() => { setCurrentView('HOME'); setMobileMenuOpen(false); }} className={`w-full text-center py-3.5 px-4 rounded-xl text-base font-bold transition-all ${currentView === 'HOME' ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-300 hover:text-amber-400 hover:bg-zinc-900'}`}>
                الرئيسية
              </button>
              <button onClick={() => { setCurrentView('ABOUT'); setMobileMenuOpen(false); }} className={`w-full text-center py-3.5 px-4 rounded-xl text-base font-bold transition-all ${currentView === 'ABOUT' ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-300 hover:text-amber-400 hover:bg-zinc-900'}`}>
                السيرة الذاتية
              </button>
              <button onClick={() => { setCurrentView('PORTFOLIO'); setMobileMenuOpen(false); }} className={`w-full text-center py-3.5 px-4 rounded-xl text-base font-bold transition-all ${currentView === 'PORTFOLIO' ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-300 hover:text-amber-400 hover:bg-zinc-900'}`}>
                معرض أعمالي
              </button>
              {isLoggedIn && (
                <button onClick={() => { setCurrentView('ADMIN'); setMobileMenuOpen(false); }} className="w-full text-center py-3.5 px-4 rounded-xl text-base font-bold text-amber-500 hover:bg-amber-500/10 transition-all flex items-center justify-center gap-2">
                  <Settings size={18} /> لوحة التحكم
                </button>
              )}
              <div className="w-full h-px bg-zinc-800 my-2"></div>
              <button onClick={() => {
                setMobileMenuOpen(false);
                setTimeout(() => {
                  const el = document.getElementById('contact');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }, 300);
              }} className="w-full text-center bg-amber-500 text-zinc-950 py-3.5 px-4 rounded-xl text-base font-black transition-all hover:bg-amber-400">
                تواصل معي
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {currentView === 'HOME' && (
          <div className="pt-24">
            {/* Full-Width Banner Section */}
            <FullWidthBanner sectionId="home" />

            {/* Hero Section */}
            <section id="home" className="relative min-h-[60vh] md:min-h-[80vh] flex items-center overflow-hidden">
              <div className="absolute top-0 right-0 -z-10 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-amber-500/10 blur-[120px] rounded-full" />
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
                  <div className="order-2 lg:order-1 text-right">
                    <span className="inline-block py-1 px-3 rounded-full bg-amber-500/10 text-amber-500 text-xs md:text-sm font-bold mb-4 md:mb-6 border border-amber-500/20">
                      مبدع في حلول التصميم
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-8xl font-black mb-4 md:mb-6 leading-tight">
                      <span className="gradient-text">خالد عمر</span>
                    </h1>
                    <p className="text-zinc-400 text-sm sm:text-base lg:text-xl leading-relaxed mb-6 md:mb-10 max-w-2xl">
                      مصمم جرافيك متخصص في بناء العلامات التجارية والهويات البصرية الرقمية والمطبوعة. خبرة تمتد لسنوات في السوق العربي تضمن لك نتائج احترافية تتجاوز التوقعات.
                    </p>
                    <div className="flex flex-wrap gap-3 md:gap-4 justify-center lg:justify-end">
                      <button onClick={() => setCurrentView('PORTFOLIO')} className="bg-amber-500 text-zinc-950 px-5 md:px-8 py-3 md:py-4 rounded-xl font-bold hover:bg-amber-400 transition-all transform hover:-translate-y-1 text-sm md:text-base">
                        استكشف معرض الأعمال
                      </button>
                      <button onClick={() => setCurrentView('ABOUT')} className="border border-zinc-700 text-zinc-300 px-5 md:px-8 py-3 md:py-4 rounded-xl font-bold hover:bg-zinc-800 transition-all transform hover:-translate-y-1 text-sm md:text-base">
                        السيرة الذاتية
                      </button>
                    </div>
                  </div>
                  <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
                    <div className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-[420px] lg:h-[420px]">
                      {/* Crafted Frame Style */}
                      <div className="absolute -inset-4 bg-gradient-to-tr from-amber-500/20 via-transparent to-amber-500/20 rounded-[40px] blur-2xl animate-pulse" />
                      <div className="absolute inset-0 bg-zinc-900 rounded-[32px] border border-zinc-800 shadow-2xl" />
                      <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl" />
                      <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />

                      <div className="relative z-10 w-full h-full p-3 h-full">
                        <div className="w-full h-full rounded-[24px] overflow-hidden border-2 border-zinc-800/50 group">
                          <ImageWithFallback
                            src={getRenderImageUrl(contact.profileImageUrl || "https://picsum.photos/seed/khaled2/600/600", 600)}
                            alt="Khaled Omar"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="eager"
                            fetchPriority="high"
                          />
                        </div>
                      </div>

                      {/* Decorative elements */}
                      <div className="absolute -bottom-6 -right-6 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-xl z-20 hidden lg:block">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                          <span className="text-xs font-bold text-zinc-300">متاح للعمل الحر</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Specialty Quick Links */}
            <section className="py-12 md:py-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                  {categories.slice(0, 4).map((cat, idx) => {
                    const icons = [<Smartphone />, <Layout />, <Printer />, <Palette />];
                    const descs = ['بوستات وحملات', 'سلة، زد، وغيرها', 'بروفايلات ومنشورات', 'شعارات وبراندينج'];
                    return (
                      <button
                        key={cat.id}
                        onClick={() => navigateToCategory(cat.id)}
                        className="glass-card p-4 md:p-8 rounded-2xl md:rounded-[32px] text-right group hover:border-amber-500/30 transition-all transform hover:-translate-y-2"
                      >
                        <div className="bg-zinc-900 w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-amber-500 mb-3 md:mb-6 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-all [&>svg]:w-4 [&>svg]:h-4 md:[&>svg]:w-6 md:[&>svg]:h-6">
                          {icons[idx % icons.length]}
                        </div>
                        <h3 className="text-sm md:text-xl font-black mb-1 md:mb-2">{cat.label}</h3>
                        <p className="text-zinc-500 text-xs md:text-sm mb-3 md:mb-6 hidden sm:block">{descs[idx % descs.length]}</p>
                        <div className="flex items-center gap-2 text-amber-500 text-xs md:text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>عرض الأعمال</span>
                          <ArrowLeft size={16} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Marquee Strips */}
            <section className="py-10 md:py-20 bg-zinc-950 overflow-hidden marquee-container" style={{ direction: 'ltr' }}>
              <div className="mb-4 md:mb-8">
                <div className="animate-marquee-left flex gap-3 md:gap-4 pl-3 md:pl-4">
                  {strip1Items.map((item, idx) => (
                    <div
                      key={`s1-${idx}`}
                      onMouseEnter={() => {
                        preloadImage(getRenderImageUrl(item.imageUrl, 1600));
                        if (item.images) item.images.forEach((img: string) => preloadImage(getRenderImageUrl(img, 1600)));
                      }}
                      onClick={() => openLightbox([item.imageUrl, ...(item.images || [])])}
                      className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] md:w-[300px] md:h-[300px] flex-shrink-0 rounded-xl md:rounded-2xl overflow-hidden border border-zinc-800 cursor-pointer portfolio-card group"
                    >
                      <ImageWithFallback src={getRenderImageUrl(item.imageUrl, 400)} className="w-full h-full object-cover" alt="" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="animate-marquee-right flex gap-3 md:gap-4 pl-3 md:pl-4">
                  {strip2Items.map((item, idx) => (
                    <div
                      key={`s2-${idx}`}
                      onMouseEnter={() => {
                        preloadImage(getRenderImageUrl(item.imageUrl, 1600));
                        if (item.images) item.images.forEach((img: string) => preloadImage(getRenderImageUrl(img, 1600)));
                      }}
                      onClick={() => openLightbox([item.imageUrl, ...(item.images || [])])}
                      className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] md:w-[300px] md:h-[300px] flex-shrink-0 rounded-xl md:rounded-2xl overflow-hidden border border-zinc-800 cursor-pointer portfolio-card group"
                    >
                      <ImageWithFallback src={getRenderImageUrl(item.imageUrl, 400)} className="w-full h-full object-cover" alt="" />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Store Images Section */}
            {storeImages.length > 0 && (
              <section className="py-12 md:py-24 bg-zinc-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-16 justify-end">
                    <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-right leading-tight">صور من <span className="text-amber-500">مقرنا</span></h2>
                    <div className="bg-zinc-900 p-3 md:p-4 rounded-xl md:rounded-2xl text-amber-500">
                      <Store className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    {storeImages.map((img) => (
                      <div
                        key={img.id}
                        onMouseEnter={() => preloadImage(getRenderImageUrl(img.imageUrl, 1600))}
                        onClick={() => openLightbox([img.imageUrl])}
                        className="group relative bg-zinc-900 rounded-2xl md:rounded-3xl overflow-hidden aspect-[4/5] border border-zinc-800 cursor-pointer shadow-2xl transition-all hover:border-amber-500/30"
                      >
                        <ImageWithFallback
                          src={getRenderImageUrl(img.imageUrl, 600)}
                          alt={img.caption || "Store Photo"}
                          className="w-full h-full object-cover"
                        />
                        {img.caption && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                            <p className="text-white text-sm font-bold text-right">{img.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Brief About Me */}
            <section className="py-12 md:py-24 bg-zinc-900/30 relative">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-8 md:gap-16 items-center">
                  <div className="lg:w-1/2 text-right">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 md:mb-6">السيرة <span className="text-amber-500">الذاتية</span></h2>
                    <p className="text-zinc-400 text-sm md:text-lg leading-relaxed mb-6 md:mb-8">
                      أنا خالد عمر، مصمم جرافيك أؤمن بأن التصميم هو الجسر الذي يربط بين علامتك التجارية وقلوب عملائك. بخبرتي الواسعة في السوق المصري والسعودي، أقدم حلولاً بصرية مبتكرة تجمع بين الجمالية والوظيفة.
                    </p>
                    <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6 md:mb-10">
                      <div className="bg-zinc-900/50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-zinc-800">
                        <div className="text-amber-500 font-black text-xl md:text-2xl mb-1">150+</div>
                        <div className="text-zinc-500 text-xs md:text-sm">مشروع مكتمل</div>
                      </div>
                      <div className="bg-zinc-900/50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-zinc-800">
                        <div className="text-amber-500 font-black text-xl md:text-2xl mb-1">5+</div>
                        <div className="text-zinc-500 text-xs md:text-sm">سنوات خبرة</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentView('ABOUT')}
                      className="inline-flex items-center gap-2 text-zinc-100 font-bold hover:text-amber-500 transition-colors group"
                    >
                      <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                      اقرأ المزيد عن رحلتي
                    </button>
                  </div>
                  <div className="lg:w-1/2 relative">
                    <div className="aspect-square bg-gradient-to-br from-amber-500/20 to-transparent rounded-[48px] overflow-hidden rotate-3 absolute inset-0"></div>
                    <ImageWithFallback
                      src={getRenderImageUrl(contact.profileImageUrl || "https://picsum.photos/seed/khaledabout/800/800", 800)}
                      className="relative z-10 aspect-square object-cover rounded-[48px] shadow-2xl transition-all duration-500"
                      alt="Khaled Omar"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {currentView === 'ABOUT' && (
          <section className="py-24 pt-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-right">
              {/* Full-Width Banner Section */}
              <div className="-mx-4 sm:-mx-6 lg:-mx-8 mb-12">
                <FullWidthBanner sectionId="about" />
              </div>

              <div className="flex items-center gap-4 mb-12 text-zinc-500 justify-end">
                <span className="text-zinc-100">السيرة الذاتية</span>
                <span>/</span>
                <button onClick={() => setCurrentView('HOME')} className="hover:text-amber-500 transition-colors">الرئيسية</button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
                <div className="space-y-10 order-2 lg:order-1">
                  <h2 className="text-3xl md:text-5xl font-black">قصة <span className="text-amber-500">إبداعي</span></h2>
                  <div className="space-y-6 text-zinc-400 text-lg leading-relaxed">
                    <p>أنا خالد عمر، مصمم جرافيك أعيش وأتنفس التصميم.</p>
                    <p>تخصصت في السوق العربي، وتحديداً في مصر والمملكة العربية السعودية.</p>
                    <div className="flex items-center justify-end gap-3 text-white mt-4">
                      <p>خبرة أكثر من +5 أعوام في مجال التصميم</p>
                      <CheckCircle className="text-amber-500" size={20} />
                    </div>
                    <div className="flex items-center justify-end gap-3 text-white">
                      <p>خريج كلية العلوم جامعة الازهر</p>
                      <CheckCircle className="text-amber-500" size={20} />
                    </div>
                    <div className="flex items-center justify-end gap-3 text-white">
                      <p>المحافظة: أسيوط - مصر</p>
                      <CheckCircle className="text-amber-500" size={20} />
                    </div>
                  </div>
                  <div className="pt-10 border-t border-zinc-900">
                    <h3 className="text-2xl font-bold mb-8">المهارات التقنية</h3>
                    <div className="space-y-8">
                      {skills.map((skill, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm font-bold">
                            <span>{skill.name}</span>
                            <span className="text-amber-500">{skill.percentage}%</span>
                          </div>
                          <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400" style={{ width: `${skill.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-10 border-t border-zinc-900 mt-10">
                    <h3 className="text-2xl font-bold mb-8">مؤسسات تم العمل معها</h3>
                    <div className="flex flex-wrap gap-4" dir="rtl">
                      {["وكالة إيليت", "شركة ادفاز", "جمعية البر بالمملكة العربية السعودية", "مكتب ابداع للدعاية والاعلان - مصر"].map((org, idx) => (
                        <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-6 py-4 flex items-center justify-center flex-grow text-zinc-400 hover:text-amber-500 hover:border-amber-500/30 transition-all cursor-default text-center">
                          {org}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="order-1 lg:order-2 lg:sticky lg:top-32" style={{ animation: 'fadeInUp 1s ease-out forwards' }}>
                  <ImageWithFallback src={getRenderImageUrl(contact.profileImageUrl || "https://picsum.photos/seed/khaled3/800/1000", 1000)} className="w-full rounded-[40px] shadow-2xl transition-all duration-700 hover:scale-[1.02]" alt="Khaled Omar" />
                </div>
              </div>
            </div>
          </section>
        )}

        {currentView === 'PORTFOLIO' && (
          <section className="py-24 pt-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4 mb-12 text-zinc-500 justify-end">
                <span className="text-zinc-100">معرض الأعمال</span>
                <span>/</span>
                <button onClick={() => setCurrentView('HOME')} className="hover:text-amber-500 transition-colors">الرئيسية</button>
              </div>
              <div className="text-center mb-8 md:mb-16">
                <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6">معرض <span className="text-amber-500">أعمالي</span> الكامل</h2>
                <p className="text-zinc-500 max-w-2xl mx-auto text-sm md:text-base">تصفح مجموعة من المشاريع التي تعكس خبرتي وتنوع مهاراتي في مختلف مجالات التصميم.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-6">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleMainCategoryChange(cat.id)}
                    className={`px-4 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl font-bold transition-all text-xs md:text-base ${selectedCategoryId === cat.id ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400'}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <SubCategoryPills />

              {/* Full-Width Banner Section */}
              <div className="-mx-4 sm:-mx-6 lg:-mx-8 mb-16">
                <FullWidthBanner sectionId={selectedCategoryId} subSectionId={selectedSubCategoryId} />
              </div>

              <PortfolioGrid items={filteredItems} />
            </div>
          </section>
        )}

        {currentView === 'CATEGORY' && (
          <section className="py-24 pt-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4 mb-12 text-zinc-500 justify-end">
                <span className="text-zinc-100">{categories.find(c => c.id === selectedCategoryId)?.label}</span>
                <span>/</span>
                <button onClick={() => setCurrentView('PORTFOLIO')} className="hover:text-amber-500 transition-colors">معرض الأعمال</button>
                <span>/</span>
                <button onClick={() => setCurrentView('HOME')} className="hover:text-amber-500 transition-colors">الرئيسية</button>
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-6 md:mb-10 text-right">أعمال <span className="text-amber-500">{categories.find(c => c.id === selectedCategoryId)?.label}</span></h2>
              <SubCategoryPills />

              {/* Full-Width Banner Section */}
              <div className="-mx-4 sm:-mx-6 lg:-mx-8 mb-16">
                <FullWidthBanner sectionId={selectedCategoryId} subSectionId={selectedSubCategoryId} />
              </div>

              <PortfolioGrid items={filteredItems} />
            </div>
          </section>
        )}

        {currentView === 'ADMIN' && isLoggedIn && (
          <section className="py-24 pt-32 bg-zinc-950 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-12">
                <button onClick={() => { setIsLoggedIn(false); setCurrentView('HOME'); }} className="text-zinc-500 hover:text-white flex items-center gap-2">
                  تسجيل الخروج <LogOut size={18} />
                </button>
                <h2 className="text-4xl font-black bg-amber-500 text-zinc-950 px-4 py-2 rounded-lg">لوحة التحكم</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats */}
                <div className="lg:col-span-1 glass-card p-8 rounded-3xl border border-zinc-800 text-right">
                  <div className="flex items-center gap-4 mb-8 text-amber-500 justify-end">
                    <h3 className="text-xl font-bold">إحصائيات الزوار</h3>
                    <BarChart3 size={24} />
                  </div>
                  <div className="text-6xl font-black mb-2">{visitorCount}</div>
                  <div className="text-zinc-500">إجمالي عدد الزيارات</div>
                </div>

                {/* Contact Settings */}
                <div className="lg:col-span-2 glass-card p-8 rounded-3xl border border-zinc-800 text-right">
                  <h3 className="text-xl font-bold mb-8">بيانات التواصل والصورة الشخصية</h3>
                  <form onSubmit={saveContact} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-500">البريد الإلكتروني</label>
                        <input name="email" defaultValue={contact.email} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2" placeholder="البريد الإلكتروني" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-500">رقم الواتساب</label>
                        <input name="whatsapp" defaultValue={contact.whatsapp} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2" placeholder="رقم الواتساب" />
                      </div>
                      <div className="space-y-3 md:col-span-2">
                        <label className="text-xs text-zinc-500">الصورة الشخصية (ارفع صورة من جهازك، أو ضع رابطاً)</label>
                        <input
                          type="file"
                          accept="image/*"
                          id="admin-profile-file"
                          name="profileImageFile"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-left file:bg-amber-500 file:text-zinc-950 file:border-0 file:px-4 file:py-1 file:rounded-xl file:mr-4 file:cursor-pointer hover:file:bg-amber-400"
                        />
                        <div className="relative mt-2">
                          <input id="admin-profile-img" name="profileImageUrl" defaultValue={contact.profileImageUrl} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-left pr-10" placeholder="أو رابط الصورة الشخصية الحالية" />
                          <button type="button" onClick={() => {
                            const input = document.getElementById('admin-profile-img') as HTMLInputElement;
                            if (input) {
                              input.value = "";
                              setContact(prev => ({ ...prev, profileImageUrl: "" }));
                            }
                          }} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                    </div>
                    <button className="bg-amber-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 mr-auto">حفظ <Save size={18} /></button>
                  </form>
                </div>

                {/* Banner Management Section */}
                <div className="lg:col-span-3 glass-card p-8 rounded-3xl border border-zinc-800 text-right">
                  <div className="flex items-center gap-4 mb-8 text-amber-500 justify-end">
                    <h3 className="text-xl font-bold">إدارة البنرات</h3>
                    <ImageIcon size={24} />
                  </div>

                  {/* Add Banner Form */}
                  <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/50 mb-8 space-y-4">
                    <h4 className="font-bold text-zinc-300 mb-4">إضافة بنر جديد (صورة أو GIF بعرض المتصفح كامل)</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Section Selector */}
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-500">القسم الرئيسي</label>
                        <select
                          value={bannerSectionId}
                          onChange={(e) => {
                            setBannerSectionId(e.target.value);
                            setBannerSubSectionId('all');
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2"
                        >
                          <option value="home">الرئيسية</option>
                          <option value="about">السيرة الذاتية</option>
                          <option value="portfolio">معرض الأعمال</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Sub-section Selector */}
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-500">القسم الفرعي (اختياري)</label>
                        <select
                          value={bannerSubSectionId}
                          onChange={(e) => setBannerSubSectionId(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2"
                          disabled={['home', 'about'].includes(bannerSectionId)}
                        >
                          <option value="all">الكل (بنر عام للقسم)</option>
                          {!['home', 'about'].includes(bannerSectionId) &&
                            subCategories
                              .filter(s => s.categoryId === (bannerSectionId === 'portfolio' ? selectedCategoryId : bannerSectionId))
                              .filter(s => s.id !== 'all')
                              .map(sub => (
                                <option key={`${sub.categoryId}-${sub.id}`} value={sub.id}>{sub.label}</option>
                              ))
                          }
                        </select>
                      </div>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-3">
                      <label className="text-xs text-zinc-500">اختر صورة أو GIF</label>
                      <input
                        type="file"
                        accept="image/*,.gif"
                        id="banner-file-input"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-left file:bg-amber-500 file:text-zinc-950 file:border-0 file:px-4 file:py-1 file:rounded-xl file:mr-4 file:cursor-pointer hover:file:bg-amber-400"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            try {
                              alert('جاري رفع البنر... يرجى الانتظار.');
                              const uploadedUrl = await db.uploadImage(e.target.files[0], 'banners');
                              setBannerPreviewUrl(uploadedUrl);
                              const urlInput = document.getElementById('banner-url-input') as HTMLInputElement;
                              if (urlInput) urlInput.value = uploadedUrl;
                              alert('تم رفع الصورة! اضغط إضافة بنر لحفظه.');
                            } catch (err: any) {
                              alert('خطأ: ' + (err.message || 'فشل في الرفع'));
                            }
                          }
                        }}
                      />
                      <div className="flex gap-3 items-center">
                        <input
                          id="banner-url-input"
                          className="flex-grow bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-left text-xs"
                          placeholder="أو الصق رابط الصورة هنا"
                          onChange={(e) => setBannerPreviewUrl(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const urlInput = document.getElementById('banner-url-input') as HTMLInputElement;
                            const url = urlInput?.value || bannerPreviewUrl;
                            addBanner(url);
                          }}
                          className="bg-amber-500 text-zinc-950 px-6 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap"
                        >
                          إضافة بنر <Plus size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Preview */}
                    {bannerPreviewUrl && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                        <img src={bannerPreviewUrl} alt="معاينة" className="w-full h-auto object-cover" style={{ maxHeight: '200px' }} />
                      </div>
                    )}
                  </div>

                  {/* Current Banners List */}
                  <h4 className="font-bold text-zinc-300 border-b border-zinc-800 pb-2 mb-6">البنرات الحالية ({banners.filter(b => !b.sectionId.startsWith('marquee')).length})</h4>
                  {banners.filter(b => !b.sectionId.startsWith('marquee')).length === 0 ? (
                    <div className="py-16 border-2 border-dashed border-zinc-800 rounded-2xl text-center text-zinc-600">
                      لا توجد بنرات حالياً
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {banners.filter(b => !b.sectionId.startsWith('marquee')).map(banner => (
                        <div key={banner.id} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 group">
                          <div className="relative aspect-[1970/500] overflow-hidden">
                            <img src={banner.imageUrl} alt="بنر" className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2">
                              <button
                                onClick={() => deleteBanner(banner.id)}
                                className="bg-red-500/90 text-white p-2 rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="p-4 flex items-center justify-between">
                            <div className="text-[10px] text-zinc-500 truncate text-left flex-shrink">{banner.imageUrl.substring(0, 50)}...</div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {banner.subSectionId !== 'all' && (
                                <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full">
                                  {getSubSectionLabel(banner.sectionId, banner.subSectionId)}
                                </span>
                              )}
                              <span className="text-xs font-bold bg-zinc-800 px-3 py-1 rounded-full">
                                {getSectionLabel(banner.sectionId)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Marquee Images (Special Images per Row) */}
                <div className="lg:col-span-3 glass-card p-8 rounded-3xl border border-zinc-800 text-right">
                  <div className="flex items-center gap-4 mb-8 text-amber-500 justify-end">
                    <h3 className="text-xl font-bold">إضافة صور خاصة لأشرطة العرض المتحركة (الرئيسية)</h3>
                    <ImageIcon size={24} />
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const formData = new FormData(form);
                    const file = formData.get('imageFile') as File;
                    const rowSelect = formData.get('marqueeRow') as string;
                    if (!file || file.size === 0) return alert('الرجاء اختيار صورة');

                    try {
                      alert("جاري رفع الصورة... يرجى الانتظار");
                      const uploadedUrl = await db.uploadImage(file, 'banners');
                      const newBanner: Banner = {
                        id: Date.now().toString(),
                        sectionId: rowSelect,
                        subSectionId: 'all',
                        imageUrl: uploadedUrl
                      };
                      await db.insertBanner(newBanner);
                      setBanners(prev => [newBanner, ...prev]);
                      form.reset();
                      alert("تمت الإضافة بنجاح");
                    } catch (err: any) {
                      alert("خطأ: " + (err.message || 'فشل في الرفع'));
                    }
                  }} className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/50 mb-8 space-y-4">
                    <h4 className="font-bold text-zinc-300 mb-2">إضافة صورة خاصة للصف الأول أو الثاني</h4>
                    <p className="text-xs text-zinc-500 mb-4">هذه الصور ستظهر فقط في الأشرطة المتحركة في الصفحة الرئيسية ولن تظهر في معرض الأعمال.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-500 text-right block">الصف</label>
                        <select name="marqueeRow" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-right">
                          <option value="marquee1">الصف الأول (العلوي)</option>
                          <option value="marquee2">الصف الثاني (السفلي)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-500 text-right block">الصورة</label>
                        <input
                          type="file"
                          accept="image/*"
                          required
                          name="imageFile"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-left file:bg-amber-500 file:text-zinc-950 file:border-0 file:px-4 file:py-1 file:rounded-xl file:mr-4 file:cursor-pointer hover:file:bg-amber-400"
                        />
                      </div>
                    </div>
                    <button type="submit" className="bg-amber-500 text-zinc-950 px-6 py-2 rounded-xl font-bold flex items-center gap-2 mt-4 mr-auto">
                      إضافة للصريط <Plus size={18} />
                    </button>
                  </form>

                  <h4 className="font-bold text-zinc-300 border-b border-zinc-800 pb-2 mb-6">الصور الخاصة الحالية</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {banners.filter(b => b.sectionId.startsWith('marquee')).map(banner => (
                      <div key={banner.id} className="relative bg-zinc-900 rounded-xl overflow-hidden aspect-square border border-zinc-800 group">
                        <ImageWithFallback src={getRenderImageUrl(banner.imageUrl, 200)} alt="Marquee img" className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
                          {banner.sectionId === 'marquee1' ? 'الصف 1' : 'الصف 2'}
                        </div>
                        <button
                          onClick={() => deleteBanner(banner.id)}
                          className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <Trash2 size={24} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {banners.filter(b => b.sectionId.startsWith('marquee')).length === 0 && (
                    <div className="py-8 border-2 border-dashed border-zinc-800 rounded-2xl text-center text-zinc-600">
                      لا توجد صور خاصة بعد
                    </div>
                  )}
                </div>

                {/* Category Management Section */}
                <div className="lg:col-span-3 glass-card p-8 rounded-3xl border border-zinc-800 text-right">
                  <div className="flex items-center gap-4 mb-8 text-amber-500 justify-end">
                    <h3 className="text-xl font-bold">إدارة الأقسام الرئيسية والفرعية</h3>
                    <Settings size={24} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Main Categories */}
                    <div className="space-y-6">
                      <h4 className="font-bold text-zinc-300 border-b border-zinc-800 pb-2">الأقسام الرئيسية</h4>
                      <form onSubmit={addCategory} className="flex gap-2">
                        <input required name="label" placeholder="اسم القسم الجديد" className="flex-grow bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2" />
                        <button className="bg-amber-500 text-zinc-950 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                          إضافة <Plus size={18} />
                        </button>
                      </form>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {categories.map(cat => (
                          <div key={cat.id} className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                            <button onClick={() => deleteCategory(cat.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                            <span className="font-bold">{cat.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sub Categories */}
                    <div className="space-y-6">
                      <h4 className="font-bold text-zinc-300 border-b border-zinc-800 pb-2">الأقسام الفرعية</h4>
                      <form onSubmit={addSubCategory} className="space-y-3">
                        <select required name="categoryId" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2">
                          <option value="">اختر القسم الرئيسي</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <input required name="label" placeholder="اسم القسم الفرعي" className="flex-grow bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2" />
                          <button className="bg-amber-500 text-zinc-950 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                            إضافة <Plus size={18} />
                          </button>
                        </div>
                      </form>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {subCategories.map(sub => (
                          <div key={`${sub.categoryId}-${sub.id}`} className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                                {categories.find(c => c.id === sub.categoryId)?.label}
                              </span>
                              <button onClick={() => deleteSubCategory(sub.id, sub.categoryId)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <span className="font-bold">{sub.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills Management Section */}
                <div className="lg:col-span-3 glass-card p-8 rounded-3xl border border-zinc-800 text-right">
                  <div className="flex items-center gap-4 mb-8 text-amber-500 justify-end">
                    <h3 className="text-xl font-bold">إدارة المهارات</h3>
                    <Award size={24} />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <h4 className="font-bold text-zinc-300 border-b border-zinc-800 pb-2">إضافة مهارة جديدة</h4>
                      <form onSubmit={addSkill} className="space-y-4">
                        <input required name="name" placeholder="اسم المهارة (مثلاً Adobe Photoshop)" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2" />
                        <div className="flex gap-4 items-center">
                          <input required type="number" name="percentage" min="0" max="100" placeholder="النسبة %" className="w-24 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2" />
                          <button className="flex-grow bg-amber-500 text-zinc-950 px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2">
                            إضافة مهارة <Plus size={18} />
                          </button>
                        </div>
                      </form>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {skills.map(skill => (
                        <div key={skill.name} className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                          <button onClick={() => deleteSkill(skill.name)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                          <div className="flex items-center gap-3">
                            <span className="text-amber-500 font-bold">{skill.percentage}%</span>
                            <span className="font-bold">{skill.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Shop Images Management Section */}
                <div className="lg:col-span-3 glass-card p-8 rounded-3xl border border-zinc-800 text-right">
                  <div className="flex items-center gap-4 mb-8 text-amber-500 justify-end">
                    <h3 className="text-xl font-bold">إدارة صور المحل</h3>
                    <Store size={24} />
                  </div>

                  {/* Add Image Form */}
                  <form onSubmit={addStoreImage} className="space-y-4 mb-10 bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/50">
                    <h4 className="font-bold text-zinc-300 mb-2">إضافة صورة جديدة</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-zinc-500 flex items-center gap-2 justify-end">
                          اختر الصورة من جهازك (مباشرة)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          required
                          name="imageFile"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-left file:bg-amber-500 file:text-zinc-950 file:border-0 file:px-4 file:py-1 file:rounded-xl file:mr-4 file:cursor-pointer hover:file:bg-amber-400"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const objectUrl = URL.createObjectURL(e.target.files[0]);
                              setPreviewUrl(objectUrl);
                            } else {
                              setPreviewUrl('');
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-zinc-500">وصف قصير</label>
                        <input name="caption" placeholder="وصف الصورة" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2" />
                      </div>
                    </div>
                    {previewUrl && (
                      <div className="mt-4 flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">معاينة الرابط المباشر:</span>
                        <div className="w-32 h-32 rounded-xl overflow-hidden border border-zinc-800">
                          <ImageWithFallback src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                    <button className="bg-amber-500 text-zinc-950 px-8 py-3 rounded-xl flex items-center gap-2 mr-auto font-bold mt-4">
                      نشر للمحل <Plus size={18} />
                    </button>
                  </form>

                  {/* List of Store Images */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {storeImages.map(img => (
                      <div key={img.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-col gap-4">
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-zinc-800 bg-black">
                          <ImageWithFallback src={getRenderImageUrl(img.imageUrl, 400)} className="w-full h-full object-cover" alt="" />
                          <div className="absolute top-2 left-2 flex gap-2">
                            <button onClick={() => deleteStoreImage(img.id)} className="bg-red-500/90 text-white p-2 rounded-lg hover:bg-red-600 transition-colors shadow-lg"><Trash2 size={16} /></button>
                            <button onClick={() => setEditingStoreImage(editingStoreImage === img.id ? null : img.id)} className="bg-zinc-800/90 text-white p-2 rounded-lg hover:bg-amber-500 transition-colors shadow-lg"><Edit2 size={16} /></button>
                          </div>
                        </div>

                        {editingStoreImage === img.id ? (
                          <div className="space-y-3">
                            <input
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-left"
                              defaultValue={img.imageUrl}
                              id={`url-${img.id}`}
                              placeholder="رابط جديد"
                            />
                            <input
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs"
                              defaultValue={img.caption}
                              id={`caption-${img.id}`}
                              placeholder="وصف جديد"
                            />
                            <button
                              onClick={() => {
                                const u = (document.getElementById(`url-${img.id}`) as HTMLInputElement).value;
                                const c = (document.getElementById(`caption-${img.id}`) as HTMLInputElement).value;
                                updateStoreImage(img.id, u, c);
                              }}
                              className="w-full bg-emerald-600 text-white text-xs py-2 rounded-lg font-bold"
                            >
                              حفظ التعديلات
                            </button>
                          </div>
                        ) : (
                          <div className="text-right">
                            <div className="text-sm font-bold text-zinc-200 truncate">{img.caption || "بدون وصف"}</div>
                            <div className="text-[10px] text-zinc-500 truncate mt-1 text-left opacity-30">{img.imageUrl}</div>
                          </div>
                        )}
                      </div>
                    ))}
                    {storeImages.length === 0 && (
                      <div className="col-span-full py-16 border-2 border-dashed border-zinc-800 rounded-2xl text-center text-zinc-600">
                        لا توجد صور للمحل حالياً
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Portfolio Item */}
                <div className="lg:col-span-3 glass-card p-8 rounded-3xl border border-zinc-800 text-right">
                  <div className="flex items-center gap-4 mb-8 text-emerald-500 justify-end">
                    <h3 className="text-xl font-bold">إضافة عمل جديد للمعرض</h3>
                    <Plus size={24} />
                  </div>
                  <form onSubmit={addItem} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm text-zinc-500">اختر الصورة الأساسية للمشروع</label>
                        <input
                          type="file"
                          accept="image/*"
                          required
                          name="imageFile"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-left file:bg-amber-500 file:text-zinc-950 file:border-0 file:px-4 file:py-1 file:rounded-xl file:mr-4 file:cursor-pointer hover:file:bg-amber-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-zinc-500">القسم الرئيسي</label>
                        <select
                          required
                          name="categoryId"
                          id="admin-main-cat"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2"
                          onChange={(e) => {
                            const catId = e.target.value;
                            const subSelect = document.getElementById('admin-sub-cat') as HTMLSelectElement;
                            if (subSelect) {
                              subSelect.innerHTML = subCategories
                                .filter(s => s.categoryId === catId)
                                .map(s => `<option value="${s.id}">${s.label}</option>`)
                                .join('');
                            }
                          }}
                        >
                          <option value="">اختر القسم</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-zinc-500">القسم الفرعي</label>
                        <select required name="subCategoryId" id="admin-sub-cat" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2">
                          <option value="">اختر القسم الرئيسي أولاً</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-zinc-500">الإضافة لشريط الصفحة الرئيسية</label>
                        <select name="marqueeStrip" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2">
                          <option value="none">لا شيء</option>
                          <option value="1">الشريط العلوي (1)</option>
                          <option value="2">الشريط السفلي (2)</option>
                        </select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm text-zinc-500">عنوان المشروع</label>
                        <input name="title" placeholder="عنوان يظهر في لوحة التحكم" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2" />
                      </div>
                      <div className="space-y-2 md:col-span-3">
                        <label className="text-sm text-zinc-500">صور إضافية للمشروع (يمكنك تحديد أكثر من صورة معاً)</label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          name="additionalImageFiles"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-left file:bg-amber-500 file:text-zinc-950 file:border-0 file:px-4 file:py-1 file:rounded-xl file:mr-4 file:cursor-pointer hover:file:bg-amber-400"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-3">
                        <label className="flex items-center gap-3 cursor-pointer p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-amber-500/50 transition-colors">
                          <input type="checkbox" name="isFullWidth" className="w-5 h-5 accent-amber-500 rounded bg-zinc-800 border-zinc-700" />
                          <div className="flex flex-col text-right">
                            <span className="text-sm font-bold text-zinc-200">عرض بعرض المتصفح بالكامل (Full Width)</span>
                            <span className="text-xs text-zinc-500">سيظهر هذا التصميم بحجم كبير يملأ الشاشة بدلاً من العرض الشبكي العادي</span>
                          </div>
                        </label>
                      </div>
                    </div>
                    <button className="bg-emerald-600 text-white px-8 py-3 rounded-xl flex items-center gap-2 mr-auto font-bold">نشر العمل <CheckCircle size={18} /></button>
                  </form>
                </div>

                {/* List Management for Portfolio */}
                <div className="lg:col-span-3 glass-card p-8 rounded-3xl border border-zinc-800 text-right">
                  <h3 className="text-xl font-bold mb-8">إدارة أعمال المعرض</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(item => (
                      <div key={item.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-col gap-4 group">
                        <div className="relative aspect-square rounded-xl overflow-hidden border border-zinc-800">
                          <ImageWithFallback src={getRenderImageUrl(item.imageUrl, 400)} className="w-full h-full object-cover" alt="" />
                          <div className="absolute top-2 left-2 flex gap-2">
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="bg-red-500/90 text-white p-2.5 rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                              title="حذف التصميم"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button
                              onClick={() => setEditingPortfolioItem(editingPortfolioItem === item.id ? null : item.id)}
                              className="bg-zinc-800/90 text-white p-2.5 rounded-lg hover:bg-amber-500 transition-colors shadow-lg"
                              title="تعديل التصميم"
                            >
                              <Edit2 size={18} />
                            </button>
                          </div>
                        </div>

                        {editingPortfolioItem === item.id ? (
                          <div className="space-y-3 p-2 bg-zinc-950/50 rounded-xl">
                            <input
                              id={`port-title-${item.id}`}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs"
                              defaultValue={item.title}
                              placeholder="العنوان"
                            />
                            <input
                              id={`port-url-${item.id}`}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-left"
                              defaultValue={item.imageUrl}
                              placeholder="رابط الصورة الرئيسية"
                            />
                            <textarea
                              id={`port-images-${item.id}`}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-left"
                              defaultValue={item.images?.join('\n')}
                              placeholder="روابط الصور الإضافية (رابط في كل سطر)"
                              rows={3}
                            />
                            <select
                              id={`port-cat-${item.id}`}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs"
                              defaultValue={item.categoryId}
                            >
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                              ))}
                            </select>
                            <label className="flex items-center gap-2 mt-2 cursor-pointer bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-xs">
                              <input type="checkbox" id={`port-fullwidth-${item.id}`} defaultChecked={item.isFullWidth} className="w-4 h-4 accent-amber-500" />
                              <span className="text-zinc-300">عرض بعرض المتصفح بالكامل</span>
                            </label>
                            <button
                              onClick={() => {
                                const t = (document.getElementById(`port-title-${item.id}`) as HTMLInputElement).value;
                                const u = (document.getElementById(`port-url-${item.id}`) as HTMLInputElement).value;
                                const imgsRaw = (document.getElementById(`port-images-${item.id}`) as HTMLTextAreaElement).value;
                                const imgs = imgsRaw.split('\n').map(url => getDirectImageUrl(url.trim())).filter(url => url !== "");
                                const c = (document.getElementById(`port-cat-${item.id}`) as HTMLSelectElement).value;
                                const isFull = (document.getElementById(`port-fullwidth-${item.id}`) as HTMLInputElement)?.checked || false;
                                updatePortfolioItem(item.id, { title: t, imageUrl: getDirectImageUrl(u), images: imgs, categoryId: c, isFullWidth: isFull });
                              }}
                              className="w-full bg-emerald-600 text-white text-xs py-2.5 rounded-lg font-bold hover:bg-emerald-700 transition-colors"
                            >
                              حفظ التعديلات
                            </button>
                          </div>
                        ) : (
                          <div className="text-right px-1">
                            <div className="font-bold text-sm truncate mb-1">{item.title}</div>
                            <div className="text-[10px] text-zinc-500 flex items-center gap-2 justify-end">
                              {item.marqueeStrip !== 'none' && (
                                <span className="text-amber-500 flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                  <Monitor size={10} /> شريط {item.marqueeStrip}
                                </span>
                              )}
                              {item.isFullWidth && (
                                <span className="text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  <Layout size={10} /> عرض كامل
                                </span>
                              )}
                              <span className="bg-zinc-800 px-1.5 py-0.5 rounded">{categories.find(c => c.id === item.categoryId)?.label}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="col-span-full py-20 border-2 border-dashed border-zinc-800 rounded-3xl text-center text-zinc-600">
                        معرض الأعمال فارغ حالياً
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl md:rounded-[40px] p-6 md:p-8 lg:p-20 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-transparent"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-start">
              <div className="text-right">
                <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black mb-4 md:mb-8">هل أنت مستعد <span className="text-amber-500">للبدء؟</span></h2>
                <div className="space-y-4 md:space-y-6">
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-6 justify-end group">
                    <div className="text-sm md:text-xl font-bold group-hover:text-amber-500 transition-colors break-all">{contact.email}</div>
                    <div className="bg-zinc-800 p-3 md:p-4 rounded-xl md:rounded-2xl text-amber-500 flex-shrink-0"><Mail className="w-5 h-5 md:w-6 md:h-6" /></div>
                  </a>
                  <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`} className="flex items-center gap-4 md:gap-6 justify-end group">
                    <div className="text-sm md:text-xl font-bold group-hover:text-emerald-500 transition-colors">{contact.whatsapp}</div>
                    <div className="bg-emerald-500/10 p-3 md:p-4 rounded-xl md:rounded-2xl text-emerald-500 flex-shrink-0"><MessageCircle className="w-5 h-5 md:w-6 md:h-6" /></div>
                  </a>
                </div>
              </div>
              <div className="bg-zinc-950 p-5 md:p-8 rounded-2xl md:rounded-[32px] border border-zinc-800">
                <form className="space-y-4 md:space-y-5 text-right" onSubmit={(e) => e.preventDefault()}>
                  <input type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:border-amber-500/50 outline-none text-sm md:text-base" placeholder="الاسم" />
                  <textarea rows={3} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:border-amber-500/50 outline-none text-sm md:text-base" placeholder="مشروعك..." />
                  <button className="w-full bg-amber-500 text-zinc-950 font-black py-3 md:py-4 rounded-xl text-sm md:text-base">إرسال</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-zinc-950 border-t border-zinc-900 text-center">
        <button onClick={() => setCurrentView('HOME')} className="text-3xl font-black gradient-text mb-6">خالد عمر</button>
        <p className="text-zinc-700 text-xs mb-4">© {new Date().getFullYear()} خالد عمر - جميع الحقوق محفوظة.</p>
        {!isLoggedIn && (
          <button onClick={() => setShowLoginModal(true)} className="text-[10px] text-zinc-800 hover:text-zinc-600 uppercase tracking-[4px] font-black">Admin Area</button>
        )}
      </footer>

      {/* Modals */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowLoginModal(false)}></div>
          <div className="relative glass-card w-full max-w-md p-10 rounded-[40px] border border-zinc-800 text-center">
            <Lock size={48} className="mx-auto mb-8 text-amber-500" />
            <h3 className="text-xl font-bold mb-6 text-zinc-200">تسجيل دخول المسؤول</h3>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-center text-lg focus:border-amber-500/50 outline-none mb-4"
              placeholder="البريد الإلكتروني"
            />
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-center text-xl focus:border-amber-500/50 outline-none mb-6"
              placeholder="كلمة المرور"
            />
            <button onClick={handleLogin} className="w-full bg-zinc-100 text-zinc-950 font-black py-4 rounded-2xl">دخول</button>
          </div>
        </div>
      )}

      {carouselImages.length > 0 && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm lightbox-enter" onClick={closeLightbox}>
          <button className="absolute top-4 right-4 md:top-8 md:right-8 text-white p-2 bg-white/10 md:bg-white/5 rounded-full z-20 hover:bg-white/10 transition-colors" onClick={closeLightbox}><X className="w-6 h-6 md:w-8 md:h-8" /></button>

          {carouselImages.length > 1 && (
            <>
              <button
                className="absolute left-2 md:left-4 lg:left-8 top-1/2 -translate-y-1/2 text-white p-2 md:p-4 bg-white/10 md:bg-white/5 rounded-full z-20 hover:bg-white/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setCarouselIndex(prev => (prev === 0 ? carouselImages.length - 1 : prev - 1));
                }}
              >
                <ChevronLeft className="w-5 h-5 md:w-8 md:h-8" />
              </button>
              <button
                className="absolute right-2 md:right-4 lg:right-8 top-1/2 -translate-y-1/2 text-white p-2 md:p-4 bg-white/10 md:bg-white/5 rounded-full z-20 hover:bg-white/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setCarouselIndex(prev => (prev === carouselImages.length - 1 ? 0 : prev + 1));
                }}
              >
                <ChevronRight className="w-5 h-5 md:w-8 md:h-8" />
              </button>

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {carouselImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCarouselIndex(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${idx === carouselIndex ? 'bg-amber-500 w-6' : 'bg-white/20'}`}
                  />
                ))}
              </div>
            </>
          )}

          <div className="relative max-w-full max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <ImageWithFallback
              src={getRenderImageUrl(carouselImages[carouselIndex], 1600)}
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
              alt={`Preview ${carouselIndex + 1}`}
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
