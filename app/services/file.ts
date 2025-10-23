import { getHeaders } from "../utils/fetch";
import { toast } from "@/app/utils/toast";

type UploadInput = File | string;

export async function uploadFileWithProgress(
  input: UploadInput,
  onProgress: (percent: number) => void,
): Promise<{ url: string; type: string }> {
  const domain = "https://prod.aidenai.io";
  const headers = await getHeaders({});

  let file: Blob;
  let fileTypeParam = "default";

  const detectFileType = (mime: string, fileName?: string): string => {
    if (fileName) {
      const ext = fileName.split(".").pop()?.toLowerCase();
      if (ext) return ext;
    }
    if (mime.startsWith("image/")) return "png";
    if (mime === "application/pdf") return "pdf";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    if (mime.startsWith("text/")) return "text";
    if (mime.includes("zip")) return "zip";
    if (mime.includes("word")) return "docx";
    if (mime.includes("excel")) return "xlsx";
    if (mime.includes("json")) return "json";
    return "default";
  };

  if (typeof input === "string") {
    const arr = input.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
    const bstr = atob(arr[arr.length - 1]); // base64 decode
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    file = new Blob([u8arr], { type: mime });
    fileTypeParam = detectFileType(mime);
  } else {
    file = input;
    fileTypeParam = detectFileType(file.type, (file as File).name);
  }

  console.log("fileTypeParam===", fileTypeParam);

  const BASE_URL = `${domain}/api/image/upload?file_type=${encodeURIComponent(
    fileTypeParam,
  )}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", BASE_URL);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.setRequestHeader("Authorization", headers["Authorization"]!);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const result = JSON.parse(xhr.responseText);
          if (result.status === 0) {
            resolve({ url: result.data.target_uri, type: fileTypeParam });
          } else {
            reject(result.message);
          }
        } catch (err) {
          reject("Invalid JSON response: " + err);
        }
      } else {
        toast.error(`Upload failed: ${xhr.status}`);
        reject(`Upload failed: ${xhr.status}`);
      }
    };

    xhr.onerror = () => {
      toast.error(`Network error during upload`);
      reject("Network error during upload");
    };

    xhr.send(file);
  });
}
