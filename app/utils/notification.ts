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
  console.log("permissionGranted", permissionGranted);
  if (!permissionGranted) {
    const permission = await requestPermission();
    console.log("permission", permission);
    permissionGranted = permission === "granted";
  }

  if (permissionGranted) {
    console.log(`[${title}] ready to send`);
    await sendNotification({
      title: title,
      body: body,
    });
  } else {
    console.warn(`[${title}] 用户未授予通知权限`);
  }
}
