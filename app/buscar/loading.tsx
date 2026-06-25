import ProductGridSkeleton from '@/app/components/ProductGridSkeleton'

export default function Loading() {
  return (
    <main className="pt-24 max-w-[1280px] mx-auto w-full px-4 md:px-16 py-8 flex flex-col gap-6">
      <div className="h-5 w-40 bg-surface-container animate-pulse" />
      <ProductGridSkeleton />
    </main>
  )
}
