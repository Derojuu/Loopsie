import { FEATURE_GROUPS, FEATURES_INTRO } from "@/constants/features";
import { SECTION_IDS } from "@/constants/site";
import { FeaturesList } from "@/components/sections/features/FeaturesList";
import { FeatureItem } from "@/components/sections/features/FeatureItem";
import { FeatureCard } from "@/components/sections/features/FeatureCard";
import { FeatureVisual } from "@/components/sections/features/FeatureVisual";
import { FEATURE_ICONS } from "@/components/sections/features/icons";

/** "What's included" — feature cards grouped by project phase. */
export function Features() {
  return (
    <section id={SECTION_IDS.features} className="features relative z-2 py-section">
      <div className="container max-w-none px-cont">
        <div className="mb-80 flex flex-col gap-16 l:mb-100 s:mb-50 s:gap-20">
          <p className="features_note text-note font-hand">{FEATURES_INTRO.note}</p>
          <h2 className="h2 features_heading max-w-900 l:max-w-560 s:max-w-329">{FEATURES_INTRO.heading}</h2>
        </div>
        <FeaturesList>
          {FEATURE_GROUPS.map((group, index) => (
            <FeatureItem key={group.id} group={group} index={index}>
              {group.cards.map((card) => {
                const Icon = FEATURE_ICONS[card.icon];
                return (
                  <FeatureCard key={card.title} card={card}>
                    <FeatureVisual icon={card.icon} width={card.iconWidth}>
                      <Icon />
                    </FeatureVisual>
                  </FeatureCard>
                );
              })}
            </FeatureItem>
          ))}
        </FeaturesList>
      </div>
    </section>
  );
}
