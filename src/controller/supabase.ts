import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";

const projectURL = process.env.PROJECT_URL ?? "";
const projectAPIKeys = process.env.API_KEY ?? "";

// Create Supabase client
const supabase = createClient(projectURL, projectAPIKeys);

// Upload file using standard upload
export async function uploadFile(file: any): Promise<string | null> {
  const originalName = file.filename + "." + file.originalname.split(".").pop();
  const filePath = path.join(__dirname, "..", "..", file.path);
  const fileBuffer = fs.readFileSync(filePath);

  // Upload to Supabase
  const { data, error } = await supabase.storage
    .from("userMedia")
    .upload(originalName, fileBuffer);
  if (error) {
    console.error("Error uploading file:", error.message);
    return null; 
  }

  const publicUrl = await getPublicUrl(data?.path);
  return publicUrl;
}

export async function getPublicUrl(filePath: string): Promise<string | null> {
  const { data } = supabase.storage.from("userMedia").getPublicUrl(filePath);
  console.log("Public URL:", data?.publicUrl);
  return data?.publicUrl;
}
