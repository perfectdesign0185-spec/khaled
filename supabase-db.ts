import { supabase } from './supabaseClient';
import { Category, SubCategory, PortfolioItem, StoreImage, Skill, ContactInfo, Banner } from './types';

// ─── Categories ───────────────────────────────────────────────

export const fetchCategories = async (): Promise<Category[]> => {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order');
    if (error) throw error;
    return (data || []).map(r => ({ id: r.id, label: r.label }));
};

export const insertCategory = async (cat: Category): Promise<void> => {
    const { error } = await supabase.from('categories').insert({ id: cat.id, label: cat.label });
    if (error) throw error;
};

export const removeCategory = async (id: string): Promise<void> => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
};

// ─── Sub-Categories ───────────────────────────────────────────

export const fetchSubCategories = async (): Promise<SubCategory[]> => {
    const { data, error } = await supabase.from('sub_categories').select('*');
    if (error) throw error;
    return (data || []).map(r => ({ id: r.id, categoryId: r.category_id, label: r.label }));
};

export const insertSubCategory = async (sub: SubCategory): Promise<void> => {
    const { error } = await supabase.from('sub_categories').insert({
        id: sub.id, category_id: sub.categoryId, label: sub.label,
    });
    if (error) throw error;
};

export const removeSubCategory = async (id: string, categoryId: string): Promise<void> => {
    const { error } = await supabase.from('sub_categories').delete().eq('id', id).eq('category_id', categoryId);
    if (error) throw error;
};

export const removeSubCategoriesByCategoryId = async (categoryId: string): Promise<void> => {
    const { error } = await supabase.from('sub_categories').delete().eq('category_id', categoryId);
    if (error) throw error;
};

// ─── Portfolio Items ──────────────────────────────────────────

export const fetchPortfolioItems = async (): Promise<PortfolioItem[]> => {
    const { data, error } = await supabase.from('portfolio_items').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(r => ({
        id: r.id,
        title: r.title,
        categoryId: r.category_id,
        subCategoryId: r.sub_category_id,
        imageUrl: r.image_url,
        images: r.images || [],
        description: r.description || '',
        marqueeStrip: r.marquee_strip || 'none',
        isFullWidth: r.is_full_width || false,
    }));
};

export const insertPortfolioItem = async (item: PortfolioItem): Promise<void> => {
    const { error } = await supabase.from('portfolio_items').insert({
        id: item.id,
        title: item.title,
        category_id: item.categoryId,
        sub_category_id: item.subCategoryId,
        image_url: item.imageUrl,
        images: item.images || [],
        description: item.description,
        marquee_strip: item.marqueeStrip || 'none',
        is_full_width: item.isFullWidth || false,
    });
    if (error) throw error;
};

export const updatePortfolioItemDB = async (id: string, updates: Partial<PortfolioItem>): Promise<void> => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.images !== undefined) dbUpdates.images = updates.images;
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
    if (updates.subCategoryId !== undefined) dbUpdates.sub_category_id = updates.subCategoryId;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.marqueeStrip !== undefined) dbUpdates.marquee_strip = updates.marqueeStrip;
    if (updates.isFullWidth !== undefined) dbUpdates.is_full_width = updates.isFullWidth;

    const { error } = await supabase.from('portfolio_items').update(dbUpdates).eq('id', id);
    if (error) throw error;
};

export const removePortfolioItem = async (id: string): Promise<void> => {
    const { error } = await supabase.from('portfolio_items').delete().eq('id', id);
    if (error) throw error;
};

export const removePortfolioItemsByCategoryId = async (categoryId: string): Promise<void> => {
    const { error } = await supabase.from('portfolio_items').delete().eq('category_id', categoryId);
    if (error) throw error;
};

export const removePortfolioItemsBySubCategory = async (subCategoryId: string, categoryId: string): Promise<void> => {
    const { error } = await supabase.from('portfolio_items').delete()
        .eq('sub_category_id', subCategoryId).eq('category_id', categoryId);
    if (error) throw error;
};

// ─── Store Images ─────────────────────────────────────────────

export const fetchStoreImages = async (): Promise<StoreImage[]> => {
    const { data, error } = await supabase.from('store_images').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(r => ({ id: r.id, imageUrl: r.image_url, caption: r.caption }));
};

export const insertStoreImage = async (img: StoreImage): Promise<void> => {
    const { error } = await supabase.from('store_images').insert({
        id: img.id, image_url: img.imageUrl, caption: img.caption || '',
    });
    if (error) throw error;
};

export const updateStoreImageDB = async (id: string, imageUrl: string, caption: string): Promise<void> => {
    const { error } = await supabase.from('store_images').update({ image_url: imageUrl, caption }).eq('id', id);
    if (error) throw error;
};

export const removeStoreImage = async (id: string): Promise<void> => {
    const { error } = await supabase.from('store_images').delete().eq('id', id);
    if (error) throw error;
};

// ─── Skills ───────────────────────────────────────────────────

export const fetchSkills = async (): Promise<Skill[]> => {
    const { data, error } = await supabase.from('skills').select('*').order('created_at');
    if (error) throw error;
    return (data || []).map(r => ({ name: r.name, percentage: r.percentage }));
};

export const insertSkill = async (skill: Skill): Promise<void> => {
    const { error } = await supabase.from('skills').insert({ name: skill.name, percentage: skill.percentage });
    if (error) throw error;
};

export const removeSkillDB = async (name: string): Promise<void> => {
    const { error } = await supabase.from('skills').delete().eq('name', name);
    if (error) throw error;
};

// ─── Contact Info ─────────────────────────────────────────────

const DEFAULT_CONTACT: ContactInfo = {
    email: 'khaled.omar@example.com',
    whatsapp: '+201234567890',
    instagram: '#',
    linkedin: '#',
    github: '#',
    profileImageUrl: 'https://picsum.photos/seed/khaled2/600/600',
    bannerUrl: '',
};

export const fetchContactInfo = async (): Promise<ContactInfo> => {
    const { data, error } = await supabase.from('contact_info').select('*').eq('id', 1).single();
    if (error || !data) return DEFAULT_CONTACT;
    return {
        email: data.email || DEFAULT_CONTACT.email,
        whatsapp: data.whatsapp || DEFAULT_CONTACT.whatsapp,
        instagram: data.instagram || DEFAULT_CONTACT.instagram,
        linkedin: data.linkedin || DEFAULT_CONTACT.linkedin,
        github: data.github || DEFAULT_CONTACT.github,
        profileImageUrl: data.profile_image_url || DEFAULT_CONTACT.profileImageUrl,
        bannerUrl: data.banner_url || '',
    };
};

export const saveContactInfoDB = async (info: ContactInfo): Promise<void> => {
    const { error } = await supabase.from('contact_info').upsert({
        id: 1,
        email: info.email,
        whatsapp: info.whatsapp,
        instagram: info.instagram,
        linkedin: info.linkedin,
        github: info.github,
        profile_image_url: info.profileImageUrl,
        banner_url: info.bannerUrl,
        updated_at: new Date().toISOString(),
    });
    if (error) throw error;
};

// ─── Visitor Count ────────────────────────────────────────────

export const incrementVisitorCount = async (): Promise<number> => {
    const { data, error } = await supabase.rpc('increment_visitor_count');
    if (error) {
        console.warn('Visitor count RPC failed:', error.message);
        return 0;
    }
    return data || 0;
};

// ─── Banners ──────────────────────────────────────────────────

export const fetchBanners = async (): Promise<Banner[]> => {
    const { data, error } = await supabase.from('banners').select('*').order('created_at', { ascending: false });
    if (error) {
        console.warn('Banners fetch failed:', error.message);
        return [];
    }
    return (data || []).map((r: any) => ({
        id: r.id,
        sectionId: r.section_id,
        subSectionId: r.sub_section_id || 'all',
        imageUrl: r.image_url,
    }));
};

export const insertBanner = async (banner: Banner): Promise<void> => {
    const { error } = await supabase.from('banners').insert({
        id: banner.id,
        section_id: banner.sectionId,
        sub_section_id: banner.subSectionId,
        image_url: banner.imageUrl,
    });
    if (error) throw error;
};

export const removeBanner = async (id: string): Promise<void> => {
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) throw error;
};

export const updateBannerDB = async (id: string, imageUrl: string): Promise<void> => {
    const { error } = await supabase.from('banners').update({ image_url: imageUrl }).eq('id', id);
    if (error) throw error;
};

// ─── Storage (Image Upload) ──────────────────────────────────

const compressImage = (file: File, maxWidth = 1600, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
        if (!file.type.startsWith('image/') || file.type === 'image/gif') {
            return resolve(file);
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve(file);

                ctx.drawImage(img, 0, 0, width, height);

                const outputType = 'image/jpeg';
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                            const compressedFile = new File([blob], `${nameWithoutExt}.jpg`, {
                                type: outputType,
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    },
                    outputType,
                    quality
                );
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
};

export const uploadImage = async (file: File, folder: string = 'portfolio'): Promise<string> => {
    let fileToUpload = file;
    try {
        fileToUpload = await compressImage(file);
    } catch (err) {
        console.warn('Failed to compress image, uploading original:', err);
    }

    const fileExt = fileToUpload.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error } = await supabase.storage.from('images').upload(fileName, fileToUpload, {
        cacheControl: 'public, max-age=31536000, immutable',
        upsert: false,
    });
    if (error) throw error;

    const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
    return urlData.publicUrl;
};

export const deleteStorageFile = async (url: string): Promise<void> => {
    try {
        const path = url.split('/images/')[1];
        if (path) {
            await supabase.storage.from('images').remove([path]);
        }
    } catch {
        console.warn('Failed to delete storage file');
    }
};
