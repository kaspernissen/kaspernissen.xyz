type SortablePhoto = { data: { date: Date | null } };

/**
 * Newest first, with undated photos last.
 *
 * A photo's date is null when it carried no EXIF timestamp and its import
 * folder covered several events, so nothing could be inferred without making
 * it up. Those still belong in the gallery — they just can't be placed in the
 * timeline, so they sort to the end instead of to 1970.
 */
export function sortPhotos<T extends SortablePhoto>(photos: T[]): T[] {
  return [...photos].sort((a, b) => {
    const da = a.data.date;
    const db = b.data.date;
    if (da && db) return +db - +da;
    if (da) return -1;
    if (db) return 1;
    return 0;
  });
}
