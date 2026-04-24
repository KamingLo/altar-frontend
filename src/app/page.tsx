import { formatDate } from '@/lib/formatDate';
import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/home/Hero';
import { ConfigSection } from '@/components/home/ConfigSection';
import { Footer } from '@/components/layout/Footer';

export default function Home() {
  const today = formatDate(new Date());

  return (
    <main className="min-h-screen flex flex-col items-center bg-black text-white overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent_50%)] pointer-events-none" />

      <Navbar />
      <Hero />
      <ConfigSection />
      <Footer date={today} />
    </main>
  );
}