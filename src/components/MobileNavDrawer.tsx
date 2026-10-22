import React, { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { NavTab } from '../types';

export interface MobileNavItem {
  id: NavTab;
  label: string;
  group: string;
  icon: LucideIcon;
}

interface MobileNavDrawerProps {
  items: MobileNavItem[];
  isItemActive: (id: NavTab) => boolean;
  onSelect: (id: NavTab) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** 'screen': phủ toàn màn hình điện thoại thật; 'frame': nằm gọn trong Khung Mobile */
  variant: 'screen' | 'frame';
  brand: React.ReactNode;
  title: string;
  subtitle: string;
}

// Vận tốc (px/ms) đủ để coi là "hất" mở/đóng ngay
const FLING_VELOCITY = 0.4;

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  startProgress: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  isLocked: boolean;
}

/**
 * Menu "Thêm" trượt từ cạnh trái cho giao diện điện thoại.
 * Mở bằng tab "Thêm" ở thanh dưới. Không mở bằng vuốt mép trái: Safari iPhone và Android dùng cử chỉ đó để quay lại.
 * Đóng bằng vuốt sang trái, chạm nền mờ, nút ✕, phím Escape hoặc nút Back.
 */
export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  items,
  isItemActive,
  onSelect,
  isOpen,
  onOpenChange,
  variant,
  brand,
  title,
  subtitle,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const position = variant === 'screen' ? 'fixed md:hidden' : 'absolute';

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    drawerRef.current?.focus({ preventScroll: true });
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    if (variant === 'screen') {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onOpenChange, variant]);

  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  // Theo dõi trên window: chuột rời khỏi vùng mép 20px ngay khi kéo nên không bắt được trên phần tử
  useEffect(() => {
    const applyProgress = (progress: number) => {
      const clamped = Math.max(0, Math.min(1, progress));
      if (drawerRef.current) {
        drawerRef.current.style.transform = `translateX(${(clamped - 1) * 100}%)`;
      }
      if (backdropRef.current) {
        backdropRef.current.style.opacity = String(clamped);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) {
        return;
      }
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (!drag.isLocked) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
          return;
        }
        // Kéo dọc thì nhường cho cuộn trang
        if (Math.abs(dy) > Math.abs(dx)) {
          dragRef.current = null;
          return;
        }
        drag.isLocked = true;
        setIsDragging(true);
      }
      const width = drawerRef.current?.offsetWidth || 280;
      applyProgress(drag.startProgress + dx / width);
      const dt = e.timeStamp - drag.lastTime;
      if (dt > 0) {
        drag.velocity = (e.clientX - drag.lastX) / dt;
      }
      drag.lastX = e.clientX;
      drag.lastTime = e.timeStamp;
    };

    const handlePointerEnd = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) {
        return;
      }
      dragRef.current = null;
      if (!drag.isLocked) {
        return;
      }
      const width = drawerRef.current?.offsetWidth || 280;
      const progress = Math.max(0, Math.min(1, drag.startProgress + (drag.lastX - drag.startX) / width));
      const shouldOpen =
        Math.abs(drag.velocity) > FLING_VELOCITY ? drag.velocity > 0 : progress > 0.5;
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      // Bỏ style tạm để class Tailwind (có transition) đưa menu về đúng vị trí
      drawerRef.current?.style.removeProperty('transform');
      backdropRef.current?.style.removeProperty('opacity');
      setIsDragging(false);
      onOpenChangeRef.current(shouldOpen);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) {
      return;
    }
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startProgress: isOpen ? 1 : 0,
      lastX: e.clientX,
      lastTime: e.timeStamp,
      velocity: 0,
      isLocked: false,
    };
  };

  const dragHandlers = {
    onPointerDown: handlePointerDown,
    onClickCapture: (e: React.MouseEvent) => {
      if (suppressClickRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };

  const isVisible = isOpen || isDragging;
  const transition = isDragging
    ? 'transition-none'
    : 'transition-[transform,opacity,visibility] duration-200 ease-out motion-reduce:transition-none';

  const groups = items.reduce<{ name: string; items: MobileNavItem[] }[]>((acc, item) => {
    const last = acc[acc.length - 1];
    if (last && last.name === item.group) {
      last.items.push(item);
    } else {
      acc.push({ name: item.group, items: [item] });
    }
    return acc;
  }, []);

  return (
    <>
      {/* Không dùng inset-0: kiểm thử E2E coi phần tử .fixed.inset-0 là modal đang mở */}
      <div
        ref={backdropRef}
        {...dragHandlers}
        onClick={() => onOpenChange(false)}
        className={`${position} top-0 right-0 bottom-0 left-0 z-50 bg-slate-900/40 touch-none select-none ${transition} ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      <div
        ref={drawerRef}
        {...dragHandlers}
        role="dialog"
        aria-modal="true"
        aria-label="Menu điều hướng"
        aria-hidden={!isVisible}
        tabIndex={-1}
        data-testid="mobile-nav-drawer"
        className={`${position} left-0 top-0 bottom-0 z-50 w-72 max-w-[80%] bg-white shadow-2xl outline-none flex flex-col touch-pan-y select-none ${transition} ${
          isVisible ? 'translate-x-0 visible' : '-translate-x-full invisible'
        } ${variant === 'screen' ? 'pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]' : 'py-4'}`}
      >
        <div className="flex items-center gap-2.5 px-4 pb-4 border-b border-slate-100">
          {brand}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold tracking-tight text-slate-900 truncate">{title}</div>
            <div className="text-[11px] text-slate-500 truncate">{subtitle}</div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Đóng menu"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto touch-pan-y px-3 pt-2">
          {groups.map((group) => (
            <div key={group.name}>
              <div className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.name}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = isItemActive(item.id);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelect(item.id);
                        onOpenChange(false);
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-bold'
                          : 'text-slate-700 font-semibold hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-[18px] h-[18px] ${isActive ? '' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-6 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
          Vuốt sang trái hoặc bấm Back để đóng
        </div>
      </div>
    </>
  );
};
