import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, image, url, type = 'website' }) {
    const siteName = "WishFlow";
    const defaultDescription = "Track and manage your wishlists easily. Save items from anywhere, organize into collections, and share with friends.";
    const defaultImage = "https://wishflow.shop/og-image.jpg"; // Replace with your actual default OG image URL

    const seo = {
        title: title ? `${title} | ${siteName}` : siteName,
        description: description || defaultDescription,
        image: image || defaultImage,
        url: url ? `https://wishflow.shop${url}` : "https://wishflow.shop",
    };

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{seo.title}</title>
            <meta name="description" content={seo.description} />

            {/* Open Graph tags for Facebook, LinkedIn, etc. */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={seo.title} />
            <meta property="og:description" content={seo.description} />
            <meta property="og:image" content={seo.image} />
            <meta property="og:url" content={seo.url} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter Card tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={seo.title} />
            <meta name="twitter:description" content={seo.description} />
            <meta name="twitter:image" content={seo.image} />

            {/* Canonical link */}
            <link rel="canonical" href={seo.url} />
        </Helmet>
    );
}
