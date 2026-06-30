import type { Metadata } from 'next';
import { Cairo, Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import '@/app/globals.css';

const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-cairo',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const { lang } = await params;
  const isAr = lang === 'ar';
  return {
    title: isAr ? 'ليبيا اليوم | آخر أخبار ليبيا والعالم على مدار الساعة' : 'Libya Today | Breaking news from Libya and the world 24/7',
    description: isAr 
      ? 'بوابة إخبارية ليبية شاملة تقدم آخر الأخبار والتحليلات السياسية والاقتصادية والرياضية والمنوعات على مدار الساعة.' 
      : 'A comprehensive Libyan news portal offering the latest news, political, economic, sports analysis around the clock.',
    icons: {
      icon: '/favicon.ico',
    },
  };
}

export default async function LocalizedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const { lang } = await params;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const fontClass = lang === 'ar' ? 'font-cairo' : 'font-inter';

  return (
    <html lang={lang} dir={dir} className={`${cairo.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className={`bg-gray-50 text-gray-900 dark:bg-darkgray-darker dark:text-gray-100 min-h-screen flex flex-col ${fontClass} antialiased transition-colors duration-300`}>
        <ThemeProvider>
          <Header />
          <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-8 py-6">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
