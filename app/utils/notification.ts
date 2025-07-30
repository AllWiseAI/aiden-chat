import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/api/notification";

type Props = {
  title: string;
  body: string;
};

export async function showNotification({ title, body }: Props) {
  console.log(`[${title}] showNotification`);
  let permissionGranted = await isPermissionGranted();
  console.log(permissionGranted);
  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === "granted";
  }

  if (permissionGranted) {
    console.log(`[${title}] ready to send`);
    sendNotification({
      title: title,
      body: body,
    });
  } else {
    console.warn(`[${title}] 用户未授予通知权限`);
  }
}
