export async function mockUpload(
  file: File,
  onProgress: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      onProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        resolve(URL.createObjectURL(file)); // 模拟上传后返回的图片 URL
      }
    }, 200);
  });
}

export function uploadImageWithProgress(
  file: File,
  onProgress: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/manage/v1/image/upload");
    xhr.setRequestHeader("Content-Type", "application/octet-stream");

    // 上传进度监听
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        // 假设接口返回的是 JSON，包含图片的 URL
        try {
          const result = JSON.parse(xhr.responseText);
          if (result.status === 0) {
            resolve(result.data.target_uri);
          } else {
            reject(result.message);
          }
        } catch (err) {
          reject("Invalid JSON response");
        }
      } else {
        reject(`Upload failed: ${xhr.status}`);
      }
    };

    xhr.onerror = () => reject("Network error during upload");

    xhr.send(file);
  });
}
