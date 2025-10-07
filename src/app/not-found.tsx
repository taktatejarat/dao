"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { Frown } from 'lucide-react';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-6">
      <Frown className="w-24 h-24 text-primary mb-6" />
      <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4">{t('not_found.title')}</h1>
      <p className="text-lg text-muted-foreground mb-8">
        {t('not_found.message')}
      </p>
      <Button asChild size="lg">
        <Link href="/dashboard">{t('not_found.go_home')}</Link>
      </Button>
    </div>
  );
}
