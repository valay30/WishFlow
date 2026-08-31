import { supabase } from '../config/supabase.js';

/** Maps DB row (snake_case) → frontend shape (camelCase) */
function mapPost(post) {
    return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        categoryColor: post.category_color,
        readTime: post.read_time,
        publishedAt: post.published_at,
        coverImage: post.cover_image,
        coverAlt: post.cover_alt,
        author: post.author,
        metaDescription: post.meta_description,
        content: post.content || [],
        isPublished: post.is_published,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
    };
}

/** GET /api/blog — all published posts, newest first */
export const getPublishedPosts = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json((data || []).map(mapPost));
    } catch (err) {
        console.error('getPublishedPosts error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

/** GET /api/blog/:slug — single published post */
export const getPublishedPostBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('slug', slug)
            .eq('is_published', true)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Post not found' });
        res.json(mapPost(data));
    } catch (err) {
        console.error('getPublishedPostBySlug error:', err.message);
        res.status(500).json({ error: err.message });
    }
};
