import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase keys in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const blogPosts = [
  {
    slug: 'the-art-of-choosing-the-perfect-birthday-gift',
    title: 'The Art of Choosing the Perfect Birthday Gift',
    excerpt: 'Struggling to find the right present? Discover our fail-safe method for choosing gifts that actually get used.',
    category: 'Gift Guides',
    category_color: '#E97451',
    read_time: '4 min read',
    published_at: 'August 12, 2026',
    cover_image: '/blog/blog_birthday_gifts_1788169593428.jpg',
    cover_alt: 'Perfectly wrapped birthday gifts',
    author: 'WishFlow Team',
    meta_description: 'Learn how to pick the perfect birthday gift every time with our simple, thoughtful framework for gift-giving.',
    is_published: true,
    content: [
      { type: 'p', text: 'We’ve all been there: staring blankly at a wall of products, wondering what on earth to get someone who seemingly has everything.' },
      { type: 'h2', text: 'The 3-Step Gift Framework' },
      { type: 'p', text: 'Instead of panic-buying a candle, try this simple framework:' },
      { type: 'list', items: ['What is their current biggest frustration?', 'What hobby have they mentioned starting?', 'What is something they use daily but would never upgrade themselves?'] },
      { type: 'tip', text: 'A luxury version of an everyday essential (like a high-end hand soap or a premium coffee tamper) is almost always a winner.' },
      { type: 'h2', text: 'Focus on Experiences' },
      { type: 'p', text: 'When physical items fail, experiences prevail. A cooking class, a subscription to a coffee service, or tickets to a local show can create memories far more valuable than a physical object.' },
      { type: 'ad' }
    ]
  },
  {
    slug: 'why-you-need-a-wedding-wishlist-and-how-to-build-one',
    title: 'Why You Need a Wedding Wishlist (And How to Build One)',
    excerpt: 'Don\'t end up with five toasters. Learn how to curate a modern wedding registry that guests will actually want to buy from.',
    category: 'Weddings',
    category_color: '#9B59B6',
    read_time: '6 min read',
    published_at: 'August 18, 2026',
    cover_image: '/blog/blog_wedding_wishlist_1788169614169.jpg',
    cover_alt: 'Elegant wedding table setting',
    author: 'WishFlow Team',
    meta_description: 'A complete guide to building a modern wedding registry or wishlist, preventing duplicate gifts, and asking for what you really want.',
    is_published: true,
    content: [
      { type: 'p', text: 'The tradition of the wedding registry was born in the 1920s to help couples outfit their first home together. Today, most couples already live together, meaning the traditional "fine china and gravy boats" registry is often outdated.' },
      { type: 'h2', text: 'The Modern Approach' },
      { type: 'p', text: 'Today’s wedding wishlist should reflect your actual lifestyle. If you love camping, ask for a high-end tent. If you’re saving for a house, it’s completely acceptable to have a cash fund.' },
      { type: 'list', items: ['Include items across all price points (aim for a $25–$250 range)', 'Don’t be afraid to add non-traditional items', 'Group items by room or activity to tell a story'] },
      { type: 'callout', text: 'Using WishFlow allows you to pull items from any store on the internet, meaning you aren’t locked into a single retailer’s ecosystem.' },
      { type: 'ad' }
    ]
  },
  {
    slug: 'smart-shopping-how-to-track-prices-and-save-money',
    title: 'Smart Shopping: How to Track Prices and Save Money',
    excerpt: 'Stop overpaying online. We break down the best strategies for tracking discounts and knowing exactly when to hit buy.',
    category: 'Money Saving',
    category_color: '#27AE60',
    read_time: '5 min read',
    published_at: 'August 24, 2026',
    cover_image: '/blog/blog_smart_shopping_1788169634326.jpg',
    cover_alt: 'Person shopping smartly on phone',
    author: 'WishFlow Team',
    meta_description: 'Stop overpaying for online purchases. Discover strategies and tools to track prices, anticipate sales, and save money.',
    is_published: true,
    content: [
      { type: 'p', text: 'Online pricing is dynamic. The price you see today might be 20% higher than it was yesterday, and 15% lower than it will be tomorrow.' },
      { type: 'h2', text: 'The 48-Hour Rule' },
      { type: 'p', text: 'The simplest way to save money? Wait. Implement a strict 48-hour rule for any non-essential purchase over $50.' },
      { type: 'tip', text: 'Add the item to your WishFlow list. Often, just the act of "saving" the item scratches the shopping itch, and 48 hours later, the urge to buy has passed.' },
      { type: 'h3', text: 'Seasonal Sales Cycles' },
      { type: 'p', text: 'Almost every product category has a specific month where it is heavily discounted:' },
      { type: 'list', items: ['January: Fitness equipment & white goods (linens/towels)', 'May: Mattresses and spring apparel', 'October: Previous-generation electronics', 'November: TVs and major appliances'] },
      { type: 'ad' }
    ]
  }
];

async function migrate() {
  console.log('Starting migration of static blog posts...');
  
  for (const post of blogPosts) {
    const { data, error } = await supabase
      .from('blog_posts')
      .upsert(post, { onConflict: 'slug' });
      
    if (error) {
      console.error(`Failed to migrate ${post.slug}:`, error.message);
    } else {
      console.log(`✓ Migrated: ${post.title}`);
    }
  }
  console.log('Migration complete!');
}

migrate();
