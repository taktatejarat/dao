// src/app/admin/layout.tsx
"use client";
import { AppLayout } from "@/components/layout/app-layout";
// فعلاً همان لی‌اوت اصلی را استفاده می‌کنیم، بعداً می‌توانیم سایدبار اختصاصی ادمین بگذاریم
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}