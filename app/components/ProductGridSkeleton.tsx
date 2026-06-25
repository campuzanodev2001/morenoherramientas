export default function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col bg-charcoal animate-pulse">
          <div className="aspect-square bg-white/10" />
          <div className="p-3 flex flex-col gap-2">
            <div className="h-2 w-1/3 bg-white/10" />
            <div className="h-3 w-4/5 bg-white/10" />
            <div className="h-4 w-1/2 bg-white/10 mt-2" />
          </div>
        </div>
      ))}
    </div>
  )
}
