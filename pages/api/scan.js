import * as cheerio from 'cheerio';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // 1. Fetch HTML
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch page: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const headers = response.headers;

        // 2. Detection Logic
        const detected = [];

        // Helpers
        const hasScript = (pattern) => {
            let found = false;
            $('script').each((i, el) => {
                const src = $(el).attr('src') || '';
                const content = $(el).html() || '';
                if (src.includes(pattern) || content.includes(pattern)) {
                    found = true;
                    return false; // break
                }
            });
            return found;
        };

        const hasMeta = (name, contentSubstr) => {
            const content = $(`meta[name="${name}"], meta[property="${name}"]`).attr('content') || '';
            return content.toLowerCase().includes(contentSubstr.toLowerCase());
        };

        const hasClass = (pattern) => {
            // Basic check on common elements or brute force logic (lightweight)
            // Cheerio doesn't "render" styles so we check raw classes.
            // Checking entire body HTML for class patterns can be heavy, check specific indicators.
            return $.html().includes(`class="${pattern}`) || $.html().includes(`class=" ${pattern}`); // simplistic
        };

        // --- Frameworks ---
        if (hasScript('_next/static') || $('script[id="__NEXT_DATA__"]').length > 0) {
            detected.push({ name: 'Next.js', category: 'Framework', icon: 'nextjs' });
            detected.push({ name: 'React', category: 'Library', icon: 'react' });
        } else if (hasScript('react') || $('[data-reactroot]').length > 0) {
            detected.push({ name: 'React', category: 'Library', icon: 'react' });
        }

        if (hasScript('vue') || $('[data-v-]').length > 0) {
            detected.push({ name: 'Vue.js', category: 'Framework', icon: 'vue' });
        }

        if (hasScript('angular') || $('app-root').length > 0) {
            detected.push({ name: 'Angular', category: 'Framework', icon: 'angular' });
        }

        if (hasScript('svelte')) {
            detected.push({ name: 'Svelte', category: 'Framework', icon: 'svelte' });
        }

        // --- CMS ---
        if (html.includes('wp-content') || hasMeta('generator', 'WordPress')) {
            detected.push({ name: 'WordPress', category: 'CMS', icon: 'wordpress' });
        }

        if (html.includes('cdn.shopify.com') || hasScript('Shopify')) {
            detected.push({ name: 'Shopify', category: 'eCommerce', icon: 'shopify' });
        }

        if (hasMeta('generator', 'Wix.com')) {
            detected.push({ name: 'Wix', category: 'CMS', icon: 'wix' });
        }

        // --- UI Libraries ---
        // Tailwind is hard to detect via class names confidently without false positives, but we can look for "text-" "bg-" "p-" patterns heavily used.
        // A better check might be specific unique classes usually found in resets or common layouts? 
        // Or just "tailwind" in any stylesheet link.
        const cssLinks = $('link[rel="stylesheet"]').map((i, el) => $(el).attr('href')).get().join(' ');
        if (cssLinks.includes('bootstrap') || hasClass('col-md-')) {
            detected.push({ name: 'Bootstrap', category: 'UI Framework', icon: 'bootstrap' });
        }

        if (cssLinks.includes('tailwind') || ($.html().match(/class="[^"]*(text-\w+-\d+|bg-\w+-\d+)[^"]*"/g) || []).length > 5) {
            // Heuristic: if we see multiple tailwind-like classes matches
            detected.push({ name: 'Tailwind CSS', category: 'UI Framework', icon: 'tailwind' });
        }

        // --- Libraries ---
        if (hasScript('jquery')) {
            detected.push({ name: 'jQuery', category: 'Library', icon: 'jquery' });
        }

        if (hasScript('framer-motion')) {
            detected.push({ name: 'Framer Motion', category: 'Animation', icon: 'framer' });
        }

        // Uniq
        const uniqueDetected = Array.from(new Map(detected.map(item => [item.name, item])).values());

        // Recommendation Logic (Simple)
        let recommendation = "Next.js + Tailwind CSS";
        if (uniqueDetected.find(d => d.name === 'WordPress')) {
            recommendation = "Headless WordPress with Next.js";
        } else if (uniqueDetected.find(d => d.name === 'Shopify')) {
            recommendation = "Shopify Hydrogen (Remix) or Next.js Commerce";
        }

        return res.status(200).json({
            technologies: uniqueDetected,
            recommendation
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to scan URL', details: error.message });
    }
}
