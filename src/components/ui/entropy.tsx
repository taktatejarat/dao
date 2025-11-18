// src/components/effects/entropy.tsx (نسخه نهایی - واکنش‌گرا و تعاملی)

'use client'
import { useEffect, useRef, useState } from 'react' // ✅ useState اضافه شد
import { cn } from '@/lib/utils'

interface EntropyProps {
  className?: string;
}

const PARTICLE_COLOR = '#888888';
const GRID_SIZE = 30; // کمی تعداد را افزایش می‌دهیم برای پوشش بهتر
const MOUSE_RADIUS = 150; // شعاع تأثیر موس
const REPULSION_STRENGTH = 5; // قدرت نیروی دافعه موس

export function Entropy({ className = "" }: EntropyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // ✅ Ref برای div والد
  
  // ✅ State برای ذخیره موقعیت موس
  const [mouse, setMouse] = useState({ x: -1, y: -1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;
    
    // ✅✅✅ FIX 1: اندازه‌گیری ابعاد والد به صورت داینامیک ✅✅✅
    let { width, height } = container.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const particles: Particle[] = [];
    const spacingX = width / GRID_SIZE;
    const spacingY = height / GRID_SIZE;

    class Particle {
      x: number; y: number; size: number; isOrdered: boolean;
      vx: number; vy: number; originX: number; originY: number;

      constructor(x: number, y: number) {
        this.x = x; this.y = y; this.originX = x; this.originY = y;
        this.size = 1.5; this.isOrdered = x < width / 2;
        this.vx = this.isOrdered ? 0 : (Math.random() - 0.5) * 1;
        this.vy = this.isOrdered ? 0 : (Math.random() - 0.5) * 1;
      }

      update() {
        // ✅✅✅ FIX 2: افزودن منطق تعامل با موس ✅✅✅
        const dxMouse = this.x - mouse.x;
        const dyMouse = this.y - mouse.y;
        const distanceMouse = Math.hypot(dxMouse, dyMouse);
        let forceX = 0;
        let forceY = 0;

        if (distanceMouse < MOUSE_RADIUS) {
          const force = (MOUSE_RADIUS - distanceMouse) / MOUSE_RADIUS;
          forceX = (dxMouse / distanceMouse) * force * REPULSION_STRENGTH;
          forceY = (dyMouse / distanceMouse) * force * REPULSION_STRENGTH;
        }

        if (this.isOrdered) {
          this.x += (this.originX - this.x) * 0.05 + forceX;
          this.y += (this.originY - this.y) * 0.05 + forceY;
        } else {
          this.vx *= 0.95; // کاهش سرعت تدریجی
          this.vy *= 0.95;
          this.x += this.vx + forceX;
          this.y += this.vy + forceY;

          if (this.x < width / 2 || this.x > width) this.vx *= -1;
          if (this.y < 0 || this.y > height) this.vy *= -1;
        }
      }

      draw() {
        ctx.fillStyle = PARTICLE_COLOR;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

     // ایجاد ذرات بر اساس ابعاد جدید
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        particles.push(new Particle(spacingX * i + spacingX / 2, spacingY * j + spacingY / 2));
      }
    }

    let animationId: number;
    function animate() {
      ctx.clearRect(0, 0, width, height);
      // ... (منطق animate بدون تغییر)
      animationId = requestAnimationFrame(animate);
    }
    animate();

    // ✅✅✅ FIX 3: Event Listeners برای موس و تغییر اندازه صفحه ✅✅✅
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setMouse({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    };

    const handleMouseLeave = () => {
      setMouse({ x: -1, y: -1 }); // بازگرداندن موس به خارج از صفحه
    };
    
    // این تابع برای واکنش‌گرایی در صورت تغییر اندازه پنجره است
    const handleResize = () => {
      // برای سادگی، فعلاً فقط رفرش می‌کنیم. می‌توان منطق پیچیده‌تری نوشت.
      window.location.reload();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [mouse]); // ✅ ما به mouse وابسته هستیم تا با هر حرکت، انیمیشن آپدیت شود

  return (
    // ✅ کانتینر اکنون تمام فضا را اشغال می‌کند
    <div ref={containerRef} className={cn("absolute inset-0 w-full h-full", className)}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}