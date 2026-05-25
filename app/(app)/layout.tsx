import { headers } from 'next/headers';
import { getAppConfig } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  const hdrs = await headers();
  const { companyName, logo, logoDark } = await getAppConfig(hdrs);

  return (
    <>
      <header className="fixed top-0 left-0 z-50 h-10 w-full bg-[#264892]">        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center bg-[#264892] px-4 py-2">
          <img
            src="/idt_a2.png"
            alt="Bogotá"
            className="h-12 md:h-16 object-contain p-1 rounded-md"
          />
        </div></header>

      <div className="pt-5 ">{children}</div>

      <footer className="fixed bottom-0 left-0 z-40 flex h-10 w-full items-center justify-center bg-[#fff] p-7">
        <p className="text-center text-sm text-[#797F8B]">
          © {new Date().getFullYear()} All rights reserved by Instituto Distrital de Turismo de
          Bogotá
        </p>
      </footer>
    </>
  );
}
