import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Luxury Eyewear, Premium Glasses & Sunglasses | JP',
  description:
    'Change the way you see the world. Eyewear For All. Get handcrafted pieces that feel tailor-made for your unique features.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
