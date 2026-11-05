import React, { useEffect, useRef } from 'react';
import { useEnigma } from '../context/EnigmaContext.tsx';
import type { ScreenId } from '../domain/types.ts';

interface SectionConfig {
  id: ScreenId;
  label: string;
  component: React.ReactNode;
}

interface ScrollspyScreenGroupProps {
  groupId: string;
  sections: readonly SectionConfig[];
}

export const ScrollspyScreenGroup: React.FC<ScrollspyScreenGroupProps> = ({
  groupId,
  sections,
}) => {
  const { activeScreen, setActiveScreen } = useEnigma();
  const screenChangedByScrollRef = useRef<ScreenId | null>(null);
  const isProgrammaticNavigationRef = useRef(false);
  const navigationScrollTimerRef = useRef<number | null>(null);
  const updateActiveSectionRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    let animationFrame = 0;

    const updateActiveSection = () => {
      animationFrame = 0;
      if (isProgrammaticNavigationRef.current) return;

      const threshold = Math.min(160, Math.max(90, window.innerHeight * 0.18));
      let visibleSectionId = sections[0]?.id;

      for (const section of sections) {
        const element = document.getElementById(`section_${section.id}`);
        if (element && element.getBoundingClientRect().top <= threshold) {
          visibleSectionId = section.id;
        }
      }

      if (visibleSectionId && visibleSectionId !== activeScreen) {
        screenChangedByScrollRef.current = visibleSectionId;
        setActiveScreen(visibleSectionId);
      }
    };

    updateActiveSectionRef.current = updateActiveSection;

    const scheduleUpdate = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(updateActiveSection);
      }
    };

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      if (navigationScrollTimerRef.current !== null) {
        window.clearTimeout(navigationScrollTimerRef.current);
      }
      isProgrammaticNavigationRef.current = false;
    };
  }, [activeScreen, sections, setActiveScreen]);

  useEffect(() => {
    if (!sections.some((section) => section.id === activeScreen)) return;

    if (screenChangedByScrollRef.current === activeScreen) {
      screenChangedByScrollRef.current = null;
      return;
    }

    const target = document.getElementById(`section_${activeScreen}`);
    if (!target || (activeScreen === sections[0]?.id && window.scrollY < 120)) return;

    if (navigationScrollTimerRef.current !== null) {
      window.clearTimeout(navigationScrollTimerRef.current);
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    isProgrammaticNavigationRef.current = true;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

    navigationScrollTimerRef.current = window.setTimeout(() => {
      navigationScrollTimerRef.current = null;
      isProgrammaticNavigationRef.current = false;
      updateActiveSectionRef.current();
    }, reduceMotion ? 0 : 850);
  }, [activeScreen, sections]);

  return (
    <div id={`scrollspy-${groupId}`} className="flex flex-col gap-[28px]">
      {sections.map((section, index) => (
        <React.Fragment key={section.id}>
          {index > 0 && (
            <div className="flex items-center gap-[12px] py-[4px]">
              <div className="h-px flex-1 bg-[#CBD5E1]" />
              <button
                type="button"
                aria-controls={`section_${section.id}`}
                onClick={() => setActiveScreen(section.id)}
                className="rounded-full border border-[#CBD5E1] bg-white px-[12px] py-[4px] text-[11px] font-semibold text-[#475569] hover:border-[#94A3B8] hover:bg-[#F8FAFC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6B5C] cursor-pointer"
              >
                Ir para {section.label} ↓
              </button>
              <div className="h-px flex-1 bg-[#CBD5E1]" />
            </div>
          )}
          <section
            id={`section_${section.id}`}
            aria-label={section.label}
            className="scroll-mt-[105px]"
            style={{ minHeight: 'calc(100svh - 126px)' }}
          >
            {section.component}
          </section>
        </React.Fragment>
      ))}
    </div>
  );
};
