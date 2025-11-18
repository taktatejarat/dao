// src/components/effects/entropy.tsx (نسخه نهایی با رفع کامل خطای ctx)

'use client'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface EntropyProps {
  className?: string;
  size?: number;
}

const PARTICLE_COLOR = '#888888'; // رنگ خاکستری ملایم برای زیبایی بیشتر
const GRID_SIZE = 25;

export function Entropy({ className = "", size = 400 }: EntropyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // ✅✅✅ THE CRITICAL FIX IS HERE: استفاده از '!' ✅✅✅
    // ما به TypeScript تضمین می‌دهیم که ctx هرگز null نخواهد بود.
    const ctx = canvas.getContext('2d')!; 
    if (!ctx) return; // این خط برای مرورگرهای بسیار قدیمی است

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const particles: Particle[] = [];
    const spacing = size / GRID_SIZE;

    class Particle {
      x: number; y: number; size: number; isOrdered: boolean;
      vx: number; vy: number; originX: number; originY: number;

      constructor(x: number, y: number) {
        this.x = x; this.y = y; this.originX = x; this.originY = y;
        this.size = 1.5; this.isOrdered = x < size / 2;
        this.vx = this.isOrdered ? 0 : (Math.random() - 0.5) * 2;
        this.vy = this.isOrdered ? 0 : (Math.random() - 0.5) * 2;
      }

      update() {
        if (this.isOrdered) {
          this.x += (this.originX - this.x) * 0.05;
          this.y += (this.originY - this.y) * 0.05;
        } else {
          this.x += this.vx; this.y += this.vy;
          if (this.x < size / 2 || this.x > size) this.vx *= -1;
          if (this.y < 0 || this.y > size) this.vy *= -1;
        }
      }

      draw() {
        ctx.fillStyle = PARTICLE_COLOR;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        particles.push(new Particle(spacing * i + spacing / 2, spacing * j + spacing / 2));
      }
    }

    let animationId: number;
    function animate() {
      ctx.clearRect(0, 0, size, size);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        
        for (let j = i + 1; j < particles.length; j++) {
          const distance = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (distance < 50) {
            ctx.beginPath();
            ctx.strokeStyle = PARTICLE_COLOR;
            ctx.globalAlpha = 1 - (distance / 50);
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          }
        }
      }
      animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [size]);

  return (
    <div className={cn("relative", className)}>
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
    </div>
  );
}