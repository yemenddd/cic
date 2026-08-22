import { localeString } from './objects/localeString';
import { localeText } from './objects/localeText';
import { speaker } from './documents/speaker';
import { programSession } from './documents/programSession';
import { galleryImage } from './documents/galleryImage';
import { partner } from './documents/partner';
import { historyEdition } from './documents/historyEdition';
import { achievementEdition } from './documents/achievementEdition';
import { achievementStudent } from './documents/achievementStudent';
import { video } from './documents/video';
import { registration } from './documents/registration';

export const schemaTypes = [
  // objects
  localeString,
  localeText,
  // documents
  speaker,
  programSession,
  galleryImage,
  partner,
  historyEdition,
  achievementEdition,
  achievementStudent,
  video,
  registration,
];
