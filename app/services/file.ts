import { getBaseDomain, getHeaders } from "../utils/fetch";

export async function uploadImageWithProgress(
  file: File,
  onProgress: (percent: number) => void,
): Promise<string> {
  const domain = await getBaseDomain();
  const headers = await getHeaders({});
  const BASE_URL = `${domain}/api/image/upload`;

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
            resolve(result.data.target_uri);
          } else {
            reject(result.message);
          }
        } catch (err) {
          reject("Invalid JSON response" + err);
        }
      } else {
        reject(`Upload failed: ${xhr.status}`);
      }
    };

    xhr.onerror = () => reject("Network error during upload");

    xhr.send(file);
  });
}
