import { NextResponse } from "next/server";
import { deleteSubmissionImageAsync } from "@/features/vendor-submissions/image-management";

type SubmissionImageRouteContext = {
  params: Promise<{
    id: string;
    imageId: string;
  }>;
};

export async function DELETE(_request: Request, context: SubmissionImageRouteContext) {
  try {
    const { id, imageId } = await context.params;
    const images = await deleteSubmissionImageAsync(id, imageId);

    return NextResponse.json({ images });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Upload failed. Please try again.",
      },
      { status: 400 },
    );
  }
}
