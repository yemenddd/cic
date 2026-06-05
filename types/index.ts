export type Language = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';

export interface NavLink {
  key: string;
  href: string;
}

export interface SpeakerProfile {
  id: string;
  name: string;
  title: string;
  image: string;
}

export interface ProgramSession {
  id: string;
  title: string;
  time: string;
  track: string;
  speaker?: string;
}
