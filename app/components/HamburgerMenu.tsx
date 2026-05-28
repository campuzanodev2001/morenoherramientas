'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { initialMenuData, type Group, type Category, type Subcategory } from '@/app/data/categories'
import Link from 'next/link'
export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const [depth, setDepth] = useState(0)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null)

  function openGroup(group: Group) {
    setSelectedGroup(group)
    setSelectedCategory(null)
    setSelectedSubcategory(null)
    setDepth(1)
  }

  function openCategory(category: Category) {
    setSelectedCategory(category)
    setSelectedSubcategory(null)
    setDepth(2)
  }

  function openSubcategory(subcategory: Subcategory) {
    setSelectedSubcategory(subcategory)
    setDepth(3)
  }

  function goBack() {
    if (depth === 3) {
      setSelectedSubcategory(null)
      setDepth(2)
    } else if (depth === 2) {
      setSelectedCategory(null)
      setDepth(1)
    } else {
      setSelectedGroup(null)
      setDepth(0)
    }
  }

  function close() {
    setIsOpen(false)
    setDepth(0)
    setSelectedGroup(null)
    setSelectedCategory(null)
    setSelectedSubcategory(null)
  }

  function handleMenuSearch() {
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    close()
    router.push(`/buscar?q=${encodeURIComponent(trimmed)}`)
  }

  const headerTitle =
    depth === 0 ? 'MENÚ' :
    depth === 1 ? (selectedGroup?.name ?? '') :
    depth === 2 ? (selectedCategory?.name ?? '') :
    (selectedSubcategory?.name ?? '')

  const panelClass = (panelDepth: number) => {
    const base = 'absolute inset-0 flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out bg-surface-container-lowest'
    if (depth === panelDepth) return `${base} translate-x-0`
    if (depth < panelDepth) return `${base} translate-x-full`
    return `${base} -translate-x-full`
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-primary-container p-2 rounded-none"
        aria-label="Abrir menú"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={close}
      />

      <nav
        aria-hidden={!isOpen}
        className={`fixed top-0 left-0 h-full w-[min(390px,90vw)] bg-surface-container-lowest z-50 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-3 px-4 h-14 bg-primary-container border-b-2 border-accent-red flex-shrink-0">
          <button
            onClick={depth > 0 ? goBack : close}
            className="text-on-primary flex-shrink-0"
            aria-label={depth > 0 ? 'Volver' : 'Cerrar menú'}
          >
            <span className="material-symbols-outlined">
              {depth > 0 ? 'arrow_back' : 'close'}
            </span>
          </button>
          <span className="font-black text-sm text-on-primary uppercase tracking-widest truncate">
            {headerTitle}
          </span>
        </div>

        {depth >= 2 && (
          <div className="px-4 py-1.5 bg-surface-container border-b border-outline-variant flex-shrink-0">
            <span className="text-xs text-on-surface-variant uppercase tracking-wide">
              {selectedGroup?.name}
              {depth >= 3 && selectedCategory && ` › ${selectedCategory.name}`}
            </span>
          </div>
        )}

        <div className="flex-1 relative overflow-hidden">

          <div className={panelClass(0)}>
            <div className="sticky top-0 bg-surface-container-lowest px-4 py-3 border-b border-outline-variant z-10">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                  search
                </span>
                <input
                  className="w-full pl-9 pr-4 py-2.5 bg-surface-container text-sm text-on-surface rounded-search focus:outline-none focus:ring-2 focus:ring-accent-red border border-outline-variant"
                  placeholder="Buscá un producto..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleMenuSearch() }}
                />
              </div>
            </div>
            {[
              { label: 'Inicio', icon: 'home' },
              { label: 'Nosotros', icon: 'info' },
              { label: 'Contacto', icon: 'mail' },
            ].map(({ label, icon }) => (
              <Link
                key={label}
                href="/"
                className="flex items-center gap-3 px-4 py-4 border-b border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container transition-colors duration-150"
              >
                <span className="material-symbols-outlined text-xl text-outline">{icon}</span>
                {label}
              </Link>
            ))}
            <div className="px-4 py-2 bg-surface-container border-b border-outline-variant">
              <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">
                Categorías
              </span>
            </div>
            <ul>
              {initialMenuData.map((group) => (
                <li key={group.name}>
                  <button
                    onClick={() => openGroup(group)}
                    className="w-full flex items-center justify-between px-4 py-4 text-left border-b border-outline-variant hover:bg-surface-container active:bg-surface-container transition-colors duration-150"
                  >
                    <span className="font-bold text-sm uppercase text-on-surface tracking-wide">
                      {group.name}
                    </span>
                    <span className="material-symbols-outlined text-accent-red flex-shrink-0">
                      chevron_right
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className={panelClass(1)}>
            {selectedGroup && (
              <ul>
                <li>
                  <a href="#" className="flex items-center px-4 py-4 border-b-2 border-accent-red text-on-surface font-bold text-sm uppercase hover:bg-surface-container transition-colors duration-150">
                    Ver todo en {selectedGroup.name}
                  </a>
                </li>
                {selectedGroup.categories.map((cat) => (
                  <li key={cat.name}>
                    {cat.subcategories?.length ? (
                      <button
                        onClick={() => openCategory(cat)}
                        className="w-full flex items-center justify-between px-4 py-4 text-left border-b border-outline-variant hover:bg-surface-container active:bg-surface-container transition-colors duration-150"
                      >
                        <span className="text-sm text-on-surface">{cat.name}</span>
                        <span className="material-symbols-outlined text-outline flex-shrink-0">chevron_right</span>
                      </button>
                    ) : (
                      <a href="#" className="flex items-center justify-between px-4 py-4 border-b border-outline-variant hover:bg-surface-container transition-colors duration-150">
                        <span className="text-sm text-on-surface">{cat.name}</span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={panelClass(2)}>
            {selectedCategory && (
              <ul>
                <li>
                  <a href="#" className="flex items-center px-4 py-4 border-b-2 border-accent-red text-on-surface font-bold text-sm uppercase hover:bg-surface-container transition-colors duration-150">
                    Ver todo en {selectedCategory.name}
                  </a>
                </li>
                {selectedCategory.subcategories?.map((sub) => (
                  <li key={sub.name}>
                    {sub.items?.length ? (
                      <button
                        onClick={() => openSubcategory(sub)}
                        className="w-full flex items-center justify-between px-4 py-4 text-left border-b border-outline-variant hover:bg-surface-container active:bg-surface-container transition-colors duration-150"
                      >
                        <span className="text-sm text-on-surface">{sub.name}</span>
                        <span className="material-symbols-outlined text-outline flex-shrink-0">chevron_right</span>
                      </button>
                    ) : (
                      <a href="#" className="flex items-center justify-between px-4 py-4 border-b border-outline-variant hover:bg-surface-container transition-colors duration-150">
                        <span className="text-sm text-on-surface">{sub.name}</span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={panelClass(3)}>
            {selectedSubcategory && (
              <ul>
                <li>
                  <a href="#" className="flex items-center px-4 py-4 border-b-2 border-accent-red text-on-surface font-bold text-sm uppercase hover:bg-surface-container transition-colors duration-150">
                    Ver todo en {selectedSubcategory.name}
                  </a>
                </li>
                {selectedSubcategory.items?.map((item) => (
                  <li key={item.name}>
                    <a href="#" className="flex items-center px-4 py-4 border-b border-outline-variant text-sm text-on-surface hover:bg-surface-container transition-colors duration-150">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </nav>
    </>
  )
}
