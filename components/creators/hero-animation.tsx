import { Camera, Heart, Mail, Megaphone, MessageCircle, Music2, Play, Video } from "lucide-react";

const ORBIT = [Camera, Play, Music2, Video, MessageCircle, Heart] as const;
const REACTIONS = [
  { Icon: Heart, left: "22%", delay: "0s" },
  { Icon: MessageCircle, left: "50%", delay: "1.4s" },
  { Icon: Mail, left: "76%", delay: "2.8s" },
] as const;

/** Decorative influencer-marketing scene: creators orbit a campaign and reactions float up. No numbers, prices or brand marks. */
export function CreatorsHeroAnimation() {
  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-[2rem] bg-forest-900 shadow-[0_30px_60px_-30px_rgba(15,42,29,0.7)]"
      role="img"
      aria-label="Illustration: creators from different platforms connecting with your campaign"
    >
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <span className="cr-ring absolute h-40 w-40 rounded-full border border-forest-300/40" />
        <span className="cr-ring absolute h-40 w-40 rounded-full border border-forest-300/40" style={{ animationDelay: "1.6s" }} />
        <span className="absolute h-[62%] w-[62%] rounded-full border border-dashed border-forest-500/60" />
        <div className="cr-orbit absolute h-[62%] w-[62%]">
          {ORBIT.map((Icon, i) => (
            <span key={i} className="absolute inset-0" style={{ transform: `rotate(${i * 60}deg)` }}>
              <span className="absolute left-1/2 top-0 -ml-6 -mt-6 h-12 w-12" style={{ transform: `rotate(${-i * 60}deg)` }}>
                <span className="cr-upright flex h-12 w-12 items-center justify-center rounded-full bg-sand-100 text-forest-700 shadow-lg">
                  <Icon className="h-5 w-5" />
                </span>
              </span>
            </span>
          ))}
        </div>
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[1.6rem] bg-purple-600 text-white shadow-xl">
          <Megaphone className="h-10 w-10" />
        </div>
        {REACTIONS.map(({ Icon, left, delay }, i) => (
          <span key={i} className="cr-float absolute bottom-10 text-sand-200" style={{ left, animationDelay: delay }}>
            <Icon className="h-5 w-5" />
          </span>
        ))}
      </div>
      <p className="absolute inset-x-0 bottom-5 text-center text-sm font-semibold text-forest-300">Matching creators to your campaign</p>
    </div>
  );
}
