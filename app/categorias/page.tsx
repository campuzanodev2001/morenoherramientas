'use client'

import { useState } from 'react'
import Link from 'next/link'
import { initialMenuData } from '@/app/data/categories'

export default function CategoriasPage() {
  const [activeGroupIdx, setActiveGroupIdx] = useState(0)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set())

  const activeGroup = initialMenuData[activeGroupIdx]
  const totalCategories = initialMenuData.reduce((sum, g) => sum + g.categories.length, 0)

  function toggleCategory(gi: number, ci: number) {
    const key = `${gi}-${ci}`
    setExpandedCategories(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function toggleSubcategory(gi: number, ci: number, si: number) {
    const key = `${gi}-${ci}-${si}`
    setExpandedSubcategories(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function expandAll() {
    const catKeys = activeGroup.categories.map((_, ci) => `${activeGroupIdx}-${ci}`)
    setExpandedCategories(prev => new Set([...prev, ...catKeys]))
  }

  function collapseAll() {
    const catKeys = new Set(
      activeGroup.categories.map((_, ci) => `${activeGroupIdx}-${ci}`)
    )
    setExpandedCategories(prev => new Set([...prev].filter(k => !catKeys.has(k))))
    const subKeys = new Set(
      activeGroup.categories.flatMap((cat, ci) =>
        (cat.subcategories ?? []).map((_, si) => `${activeGroupIdx}-${ci}-${si}`)
      )
    )
    setExpandedSubcategories(prev => new Set([...prev].filter(k => !subKeys.has(k))))
  }

  const allExpandedInGroup = activeGroup.categories.every((_, ci) =>
    expandedCategories.has(`${activeGroupIdx}-${ci}`)
  )

  return (
    <div className="min-h-screen bg-surface flex flex-col">

      <header className="bg-primary-container border-b-4 border-accent-red px-4 md:px-16 py-0 flex items-center justify-between h-14 flex-shrink-0">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-on-primary/70 hover:text-on-primary transition-colors text-sm font-medium"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          <span className="hidden sm:inline uppercase tracking-wide text-xs font-bold">Inicio</span>
        </Link>

        <h1 className="font-black text-on-primary uppercase tracking-tighter text-base md:text-lg absolute left-1/2 -translate-x-1/2">
          Todas las categorías
        </h1>

        <span className="bg-accent-red text-on-primary text-[11px] font-black px-2.5 py-1 tabular-nums">
          {totalCategories}
        </span>
      </header>

      <div className="sticky top-0 z-10 bg-primary-container border-b-2 border-outline flex items-stretch overflow-x-auto flex-shrink-0">
        {initialMenuData.map((group, gi) => (
          <button
            key={group.name}
            onClick={() => setActiveGroupIdx(gi)}
            className={`flex items-center gap-1.5 px-3 md:px-5 py-3 text-[11px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 transition-colors flex-shrink-0 ${
              gi === activeGroupIdx
                ? 'text-on-primary border-accent-red'
                : 'text-on-primary/55 border-transparent hover:text-on-primary/80'
            }`}
          >
            {group.name}
            <span className={`text-[10px] font-black px-1.5 py-0.5 ${
              gi === activeGroupIdx ? 'bg-accent-red/25 text-accent-red' : 'bg-on-primary/10 text-on-primary/50'
            }`}>
              {group.categories.length}
            </span>
          </button>
        ))}

        <div className="ml-auto flex items-center px-3 border-l border-outline flex-shrink-0">
          <button
            onClick={allExpandedInGroup ? collapseAll : expandAll}
            className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-on-primary/60 hover:text-on-primary transition-colors whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base">
              {allExpandedInGroup ? 'unfold_less' : 'unfold_more'}
            </span>
            <span className="hidden md:inline">
              {allExpandedInGroup ? 'Colapsar todo' : 'Expandir todo'}
            </span>
          </button>
        </div>
      </div>

      <main className="flex-1 px-4 md:px-16 py-6 flex flex-col gap-2">

        {activeGroup.categories.map((category, ci) => {
          const catKey = `${activeGroupIdx}-${ci}`
          const isCatExpanded = expandedCategories.has(catKey)
          const subcatCount = category.subcategories?.length ?? 0

          return (
            <div key={category.name} className="border-2 border-outline border-l-4 border-l-accent-red overflow-hidden">

              <button
                onClick={() => toggleCategory(activeGroupIdx, ci)}
                className="w-full flex items-center justify-between px-4 py-3 bg-primary-container hover:bg-primary-container/90 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-black text-sm text-on-primary uppercase tracking-wide truncate">
                    {category.name}
                  </span>
                  {subcatCount > 0 && (
                    <span className="flex-shrink-0 text-[10px] font-black px-1.5 py-0.5 bg-accent-red/20 text-accent-red">
                      {subcatCount} {subcatCount === 1 ? 'subcategoría' : 'subcategorías'}
                    </span>
                  )}
                </div>
                <span className="material-symbols-outlined text-on-primary/70 flex-shrink-0 ml-2">
                  {isCatExpanded ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {isCatExpanded && (
                <div className="bg-surface-container-lowest">
                  {subcatCount === 0 ? (
                    <div className="px-4 py-3 border-t border-outline-variant">
                      <a
                        href="#"
                        className="flex items-center justify-between text-sm text-on-surface hover:text-accent-red transition-colors group"
                      >
                        <span>Ver todos los productos</span>
                        <span className="material-symbols-outlined text-base text-outline group-hover:text-accent-red transition-colors">
                          arrow_forward
                        </span>
                      </a>
                    </div>
                  ) : (
                    category.subcategories!.map((subcategory, si) => {
                      const subKey = `${activeGroupIdx}-${ci}-${si}`
                      const isSubExpanded = expandedSubcategories.has(subKey)
                      const hasItems = (subcategory.items?.length ?? 0) > 0

                      return (
                        <div key={subcategory.name} className="border-t border-outline-variant">
                          <div className="flex items-center border-l-2 border-l-outline ml-4">
                            {hasItems ? (
                              <button
                                onClick={() => toggleSubcategory(activeGroupIdx, ci, si)}
                                className="flex-1 flex items-center justify-between px-4 py-3 text-left hover:bg-surface-container transition-colors group"
                              >
                                <span className="text-sm text-on-surface group-hover:text-accent-red transition-colors">
                                  {subcategory.name}
                                </span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-[10px] font-black text-on-surface-variant">
                                    {subcategory.items!.length}
                                  </span>
                                  <span className="material-symbols-outlined text-base text-outline group-hover:text-accent-red transition-colors">
                                    {isSubExpanded ? 'expand_less' : 'expand_more'}
                                  </span>
                                </div>
                              </button>
                            ) : (
                              <a
                                href="#"
                                className="flex-1 flex items-center justify-between px-4 py-3 hover:bg-surface-container transition-colors group"
                              >
                                <span className="text-sm text-on-surface group-hover:text-accent-red transition-colors">
                                  {subcategory.name}
                                </span>
                                <span className="material-symbols-outlined text-base text-outline group-hover:text-accent-red transition-colors flex-shrink-0">
                                  arrow_forward
                                </span>
                              </a>
                            )}
                          </div>

                          {hasItems && isSubExpanded && (
                            <div className="flex flex-wrap gap-2 px-8 py-3 bg-surface-container border-t border-outline-variant/50">
                              {subcategory.items!.map((item) => (
                                <a
                                  key={item.name}
                                  href="#"
                                  className="inline-flex items-center px-2.5 py-1 border border-outline-variant text-xs text-on-surface-variant hover:border-accent-red hover:text-accent-red transition-colors"
                                >
                                  {item.name}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )
        })}

      </main>
    </div>
  )
}
