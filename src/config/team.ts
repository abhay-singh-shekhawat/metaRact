/**
 * The three founders.
 *
 * Supplied by the studio on 2026-10-19 (the images and `contact.txt` in the
 * hand-off folder). Every value below is supplied data: the only role recorded
 * anywhere in that hand-off is "founder", so no specialisms, biographies, or
 * seniority titles are invented here. The portraits are the founders' own
 * profile images, not commissioned headshots — hence the avatar treatment on
 * the About page rather than a full-bleed team portrait.
 */

export interface Founder {
  name: string;
  /** The one role the studio has stated. */
  role: string;
  photo: {
    src: string;
    /** Intrinsic pixels, so next/image can reserve the right box. */
    width: number;
    height: number;
  };
  linkedin: string;
  github: string;
  /** Supplied exactly as written, including the leading "@". */
  whatsapp: string;
}

export const founders: Founder[] = [
  {
    name: "Prince Sharma",
    role: "Founder",
    photo: { src: "/team/prince-sharma.jpg", width: 447, height: 447 },
    linkedin: "https://www.linkedin.com/in/prince-sharma-637710327",
    github: "https://github.com/strawhat0luffy",
    whatsapp: "@luffyyyyyyyyy",
  },
  {
    name: "Aradhya Sharma",
    role: "Founder",
    photo: { src: "/team/aradhya-sharma.jpg", width: 400, height: 400 },
    linkedin: "https://www.linkedin.com/in/aradhy-sharma-005a1332a",
    github: "https://github.com/Aradhya327",
    whatsapp: "@KENPANCHI_ZARAKi",
  },
  {
    name: "Abhay Shekhawat",
    role: "Founder",
    photo: { src: "/team/abhay-shekhawat.jpg", width: 462, height: 663 },
    linkedin: "https://www.linkedin.com/in/abhay-singh-shekhawat-354218254",
    github: "https://github.com/abhay-singh-shekhawat",
    whatsapp: "@abhay_singh10",
  },
];
