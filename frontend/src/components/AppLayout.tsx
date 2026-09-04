import { Outlet } from 'react-router'
import { Toaster } from 'sonner'

import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'

/** Header + left sidebar navigation + content. Used for every page except
 * login/register, which don't need navigation yet. */
function AppLayout() {
  return (
    <div>
      <Header />
      <div className="container mx-auto flex min-h-[85vh] gap-8 px-4 pt-24">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  )
}

export default AppLayout
