/**
 * imgBB Image Upload Service
 * Free image hosting with CDN support
 * https://api.imgbb.com/
 *
 * Benefits over Supabase Storage:
 * - No egress costs
 * - Global CDN
 * - No storage limits for free tier
 */

// API key from environment or fallback
const IMGBB_API_KEY =
  process.env.NEXT_PUBLIC_IMGBB_API_KEY || "c46f48a848428c48a80fa1fd1db02c96";
const IMGBB_API_URL = "https://api.imgbb.com/1/upload";

interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: number;
    height: number;
    size: number;
    time: number;
    expiration: number;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    medium?: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

/**
 * Upload an image to imgBB
 * @param file - File object or base64 string
 * @param name - Optional name for the image
 * @returns URL of the uploaded image
 */
export async function uploadToImgBB(
  file: File | string,
  name?: string
): Promise<string> {
  if (!IMGBB_API_KEY) {
    console.error("IMGBB_API_KEY is not configured");
    throw new Error("Image upload service is not configured");
  }

  const formData = new FormData();
  formData.append("key", IMGBB_API_KEY);

  if (typeof file === "string") {
    // If it's a base64 string, extract just the data part
    const base64Data = file.includes(",") ? file.split(",")[1] : file;
    formData.append("image", base64Data);
  } else {
    // If it's a File object
    formData.append("image", file);
  }

  if (name) {
    formData.append("name", name);
  }

  try {
    const response = await fetch(IMGBB_API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`imgBB upload failed: ${response.status}`);
    }

    const result: ImgBBResponse = await response.json();

    if (!result.success) {
      throw new Error("imgBB upload unsuccessful");
    }

    // Return the display URL (optimized for web display)
    return result.data.display_url;
  } catch (error) {
    console.error("Error uploading to imgBB:", error);
    throw error;
  }
}

/**
 * Upload avatar image with size optimization
 * @param file - File object from input
 * @returns URL of the uploaded avatar
 */
export async function uploadAvatar(file: File): Promise<string> {
  // Validate file type
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!validTypes.includes(file.type)) {
    throw new Error(
      "Invalid file type. Please upload JPEG, PNG, GIF, or WebP."
    );
  }

  // Validate file size (max 2MB)
  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("File size must be less than 2MB.");
  }

  // Generate a unique name for the avatar
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(7);
  const name = `avatar_${timestamp}_${randomStr}`;

  return uploadToImgBB(file, name);
}

/**
 * Upload project/idea image
 * @param file - File object from input
 * @returns URL of the uploaded image
 */
export async function uploadProjectImage(file: File): Promise<string> {
  // Validate file type
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!validTypes.includes(file.type)) {
    throw new Error(
      "Invalid file type. Please upload JPEG, PNG, GIF, or WebP."
    );
  }

  // Validate file size (max 5MB for project images)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("File size must be less than 5MB.");
  }

  // Generate a unique name
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(7);
  const name = `project_${timestamp}_${randomStr}`;

  return uploadToImgBB(file, name);
}
