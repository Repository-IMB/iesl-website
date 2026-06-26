import type { Color, IconName } from "./icons";
import type { CtaButton, Paragraph, SplitTitle, FeatureCard } from "./shared.type";
export type { TestimonialCard } from "./shared.type";

export type FloatingBadge = {
  icon: IconName;
  title: string;
  description: string;
  color: Color;
  image?: ImageMetadata;
}

export type HeroSlide = {
  image: ImageMetadata;
  floatingBadges: FloatingBadge[];
}

export type HomeHeroSection = {
  badge: string;
  badgeIcon: IconName;
  title: SplitTitle & { end: string };
  description: string;
  cta: {
    primary: CtaButton;
    secondary: CtaButton;
  };
  slides: HeroSlide[];
}

export type AboutSection = {
  badge: string;
  title: string;
  paragraphs: Paragraph[];
  closing: string;
  features: FeatureCard[];
}

export type CommunityItem = {
  icon: IconName;
  text: string;
}

export type CommunitySection = {
  badge: string;
  title: SplitTitle;
  description: string;
  items: CommunityItem[];
  floatingBadges: FloatingBadge[];
  cta: CtaButton;
}

export type WellnessSection = {
  badge: string;
  title: SplitTitle;
  description: string;
  slides: FloatingBadge[][];
  cta?: CtaButton;
}

