import Gallery from "@/components/sections/Gallery";
import { getGalleryImages } from "@/lib/db/queries";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "معرض الصور | مؤتمر الإبداع والابتكار",
  description: "لقطات من فعاليات وجلسات وكواليس مؤتمر الإبداع والابتكار عبر دوراته.",
});

export default async function GalleryPage() {
  const images = await getGalleryImages();
  return <Gallery data={images} />;
}
