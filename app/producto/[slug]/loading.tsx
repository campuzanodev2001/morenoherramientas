export default function Loading() {
  return (
    <main className="pt-24 max-w-[1280px] mx-auto w-full px-4 md:px-16 py-8">
      <div className="grid md:grid-cols-[3fr_2fr] gap-8 lg:gap-16">
        <div className="aspect-square bg-surface-container animate-pulse" />
        <div className="flex flex-col gap-4">
          <div className="h-4 w-24 bg-surface-container animate-pulse" />
          <div className="h-8 w-3/4 bg-surface-container animate-pulse" />
          <div className="h-10 w-40 bg-surface-container animate-pulse" />
          <div className="h-14 w-full bg-surface-container animate-pulse" />
        </div>
      </div>
    </main>
  )
}
