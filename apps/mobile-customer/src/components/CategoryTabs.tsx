import type { MenuCategory } from '../api/types';

export function CategoryTabs({
  categories,
  activeId,
  onSelect,
}: {
  categories: MenuCategory[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="no-scrollbar sticky top-[65px] z-10 flex gap-2 overflow-x-auto border-b border-border bg-surface px-4 py-3">
      {categories.map((category) => {
        const active = category.id === activeId;
        return (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={`shrink-0 rounded-pill px-4 py-1.5 text-sm font-medium transition-colors ${
              active ? 'bg-primary text-white' : 'border border-border bg-white text-ink'
            }`}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
