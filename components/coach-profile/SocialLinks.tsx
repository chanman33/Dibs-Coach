import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Facebook, Instagram, Linkedin, Youtube, ExternalLink, Twitter } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as React from 'react';

/**
 * @description Displays a card with marketing/social links for a coach profile.
 * @param {object} props - Component props
 * @param {object} props.links - Social links (website, facebook, instagram, linkedin, youtube, tiktok)
 * @param {string} [props.className] - Optional className for styling
 */
export function SocialLinks({ links, className }: { links: Record<string, string | undefined>, className?: string }) {
  const socialItems = [
    {
      key: 'website',
      label: 'Website',
      icon: Globe,
      url: links.website,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      icon: Facebook,
      url: links.facebook,
    },
    {
      key: 'instagram',
      label: 'Instagram',
      icon: Instagram,
      url: links.instagram,
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      icon: Linkedin,
      url: links.linkedin,
    },
    {
      key: 'youtube',
      label: 'YouTube',
      icon: Youtube,
      url: links.youtube,
    },
    {
      key: 'tiktok',
      label: 'TikTok',
      icon: (props: any) => (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 8v8a3 3 0 1 0 3-3h-1" /><path d="M16 8a5 5 0 0 0 5 5" /><path d="M16 3v5h5" /></svg>
      ),
      url: links.tiktok,
    },
    {
      key: 'x',
      label: 'X (Twitter)',
      icon: Twitter,
      url: links.xUrl,
    },
  ];

  const hasAny = socialItems.some(item => !!item.url);

  return (
    <Card className={cn('mt-6', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Marketing & Socials</CardTitle>
      </CardHeader>
      <CardContent>
        {hasAny ? (
          <ul className="space-y-3">
            {socialItems.map(({ key, label, icon: Icon, url }) =>
              url ? (
                <li key={key}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
                    aria-label={label}
                  >
                    <Icon className="h-5 w-5 text-primary/80 group-hover:text-primary" />
                    <span className="font-medium text-sm flex-1 truncate">{label}</span>
                    <ExternalLink className="h-4 w-4 opacity-60 group-hover:opacity-100" />
                  </a>
                </li>
              ) : null
            )}
          </ul>
        ) : (
          <div className="text-sm text-muted-foreground italic py-2">No marketing or social links provided.</div>
        )}
      </CardContent>
    </Card>
  );
} 