import { Outlet } from 'react-router'
import { Toaster } from 'sonner'

import Footer from '@/components/Footer'
import Header from '@/components/Header'

function RouterLayout() {
  return (
    <div>
      <Header />
      <main className="container mx-auto min-h-[85vh] px-4 pt-24">
        <Outlet />
      </main>
      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  )
}

export default RouterLayout
