import { NextResponse } from "next/server";
import { uploadSubmissionImageAsync } from "@/features/vendor-submissions/image-management";

type SubmissionImagesRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function friendlyUploadError(error: unknown) {
  const message = error instanceof Error ? error.message : "Upload failed. Please try again.";

  if (message.includes("5 MB")) {
    return "Image is too large.";
  }

  if (message.includes("330x330")) {
    return "Image dimensions are invalid.";
  }

  if (message.includes("JPG") || message.includes("JPEG") || message.includes("WebP")) {
    return "Unsupported image format.";
  }

  return message || "Upload failed. Please try again.";
}

export async function POST(request: Request, context: SubmissionImagesRouteContext) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const images = await uploadSubmissionImageAsync(id, formData);

    return NextResponse.json({ images });
  } catch (error) {
    return NextResponse.json(
      { error: friendlyUploadError(error) },
      { status: 400 },
    );
  }
}
