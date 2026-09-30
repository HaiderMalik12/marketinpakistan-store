import { isAdmin } from "@/app/lib/session";
import { signUpload } from "@/app/lib/cloudinary";

export async function POST() {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json(signUpload());
}
