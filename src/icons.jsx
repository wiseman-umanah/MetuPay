// Small line icons (24×24, stroke = currentColor).
const I = ({ children, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)

export const Bell = () => <I><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></I>
export const Eye = () => <I size={18}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></I>
export const EyeOff = () => <I size={18}><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></I>
export const Plus = () => <I size={18}><path d="M12 5v14M5 12h14" /></I>
export const Send = () => <I size={18}><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4z" /></I>
export const Bank = () => <I><path d="M3 10h18L12 4z" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18" /></I>
export const Wallet = () => <I><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M3 10h18M16 15h2" /></I>
export const Phone = () => <I><rect x="7" y="2" width="10" height="20" rx="2.5" /><path d="M11 18h2" /></I>
export const Wifi = () => <I><path d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0" /><circle cx="12" cy="19.5" r=".8" fill="currentColor" /></I>
export const Bolt = () => <I><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></I>
export const Tv = () => <I><rect x="2" y="7" width="20" height="14" rx="2.5" /><path d="m8 3 4 4 4-4" /></I>
export const Piggy = () => <I><path d="M19 11a7 6 0 0 0-13-2.5H4v4l2 1.5V18h3v-2h5v2h3v-3a6 6 0 0 0 2-4z" /><path d="M16 10h.01" /></I>
export const Grid = () => <I><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></I>
export const Home = () => <I><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /></I>
export const Card = () => <I><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20M6 15h4" /></I>
export const Gift = () => <I><rect x="3" y="8" width="18" height="5" rx="1" /><path d="M5 13v8h14v-8M12 8v13" /><path d="M12 8S10.5 3 8 4s0 4 4 4zm0 0s1.5-5 4-4 0 4-4 4z" /></I>
export const User = () => <I><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></I>
export const LogOut = () => <I size={20}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></I>
export const Shield = () => <I size={16}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></I>
export const ArrowIn = () => <I size={18}><path d="M17 7 7 17M7 8v9h9" /></I>
export const ArrowOut = () => <I size={18}><path d="M7 17 17 7M8 7h9v9" /></I>
