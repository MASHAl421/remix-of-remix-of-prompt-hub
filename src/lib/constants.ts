export const CATEGORIES = [
  "Animal & Pets",
  "Art & Animation",
  "ASMR & Satisfying",
  "Comedy & Entertainment",
  "Dark Psychology",
  "DIY & Crafts",
  "Emotional & Inspirational",
  "Fantasy & Sci-Fi",
  "Finance & Business",
  "Food & Cooking",
  "Health & Fitness",
  "Historical & Nostalgia",
  "Horror",
  "Kids & Family",
  "Luxury & Lifestyle",
  "Motivational",
  "Nature & Wildlife",
  "Science & Education",
  "Sports & Action",
  "Technology & AI",
  "Travel",
  "True Crime",
] as const;

export const LINK_TYPES = [
  "Tool",
  "Tutorial",
  "Channel",
  "Community",
  "Dataset",
  "Template",
  "Article",
  "Other",
] as const;

export const IMAGE_BUCKET = "library-images";
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
