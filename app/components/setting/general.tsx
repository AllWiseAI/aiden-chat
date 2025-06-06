import { useAuthStore } from "../../store";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Path } from "../../constant";
import { Theme, useAppConfig } from "@/app/store";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/shadcn/select";

export default function General() {
  const authStore = useAuthStore();
  const config = useAppConfig();
  const updateConfig = config.update;
  const email = useAuthStore((state) => state.user.email);
  const navigate = useNavigate();
  const logout = async () => {
    navigate(Path.Login);
    try {
      const success = await authStore.logout();
      if (success) {
        toast.success("Logout success", {
          className: "w-auto max-w-max",
        });
      }
    } catch (e: any) {
      toast.error(e.message, {
        className: "w-auto max-w-max",
      });
    }
  };
  return (
    <div className="w-full h-full flex flex-col gap-4 justify-start items-center p-4 text-black dark:text-white">
      <div className="w-full flex flex-col gap-6 px-4 pb-6 border-b">
        <div className="font-medium">Account</div>
        <div className="flex justify-between items-center gap-5 p-3 bg-[#F3F5F7] dark:bg-[#232627]/30 border border-[#E8ECEF] dark:border-[#232627] rounded-xl text-sm">
          <p>{email}</p>
          <div
            className="text-[#EF466F] underline cursor-pointer hover:opacity-70"
            onClick={logout}
          >
            Log Out
          </div>
        </div>
      </div>
      {/* <div className="w-full flex justify-between items-center gap-6 px-4 py-6 border-b">
        <div className="font-medium">Country</div>
        <Select defaultValue={"china"}>
          <SelectTrigger className="w-[180px] dark:border-[#232627]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#F3F5F7] dark:bg-[#232627]">
            <SelectGroup className="space-y-2">
              <SelectItem
                value="china"
                className="hover:!bg-[#E8ECEF] dark:hover:!bg-black"
              >
                China
              </SelectItem>
              <SelectItem
                value="russia"
                className="hover:!bg-[#E8ECEF] dark:hover:!bg-black"
              >
                Russia
              </SelectItem>
              <SelectItem
                value="uk"
                className="hover:!bg-[#E8ECEF] dark:hover:!bg-black"
              >
                United Kingdom
              </SelectItem>
              <SelectItem
                value="france"
                className="hover:!bg-[#E8ECEF] dark:hover:!bg-black"
              >
                France
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="w-full flex justify-between items-center gap-6 px-4 py-6 border-b">
        <div className="font-medium">Language</div>
        <Select defaultValue={"en"}>
          <SelectTrigger className="w-[180px] dark:border-[#232627]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#F3F5F7] dark:bg-[#232627]">
            <SelectGroup className="space-y-2">
              <SelectItem
                value="en"
                className="hover:!bg-[#E8ECEF] dark:hover:!bg-black"
              >
                English
              </SelectItem>
              <SelectItem
                value="cn"
                className="hover:!bg-[#E8ECEF] dark:hover:!bg-black"
              >
                Chinese
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div> */}
      <div className="w-full flex justify-between items-center gap-6 px-4 py-6">
        <div className="font-medium">Appearance</div>
        <Select
          defaultValue={config.theme}
          onValueChange={(value) => {
            updateConfig((config) => {
              config.theme = value as Theme;
            });
          }}
        >
          <SelectTrigger className="w-[180px] dark:border-[#232627]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#F3F5F7] dark:bg-[#232627]">
            <SelectGroup className="space-y-2">
              <SelectItem
                value="auto"
                className="hover:!bg-[#E8ECEF] dark:hover:!bg-black"
              >
                System match
              </SelectItem>
              <SelectItem
                value="light"
                className="hover:!bg-[#E8ECEF] dark:hover:!bg-black"
              >
                Light
              </SelectItem>
              <SelectItem
                value="dark"
                className="hover:!bg-[#E8ECEF] dark:hover:!bg-black"
              >
                Dark
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
