import { useAuthStore } from "../../store";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Path } from "../../constant";

export default function General() {
  const authStore = useAuthStore();
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
    <div className="w-full h-full flex justify-center p-4">
      <div className="w-full flex flex-col gap-6 px-4">
        <div className="text-[#141718] font-medium">Account</div>
        <div className="flex justify-between items-center gap-5 p-3 bg-[#F3F5F7] border border-[#E8ECEF] rounded-xl text-sm">
          <p className="text-black dark:text-white">{email}</p>
          <div
            className="text-[#EF466F] underline cursor-pointer hover:opacity-70"
            onClick={logout}
          >
            Log Out
          </div>
        </div>
      </div>
    </div>
  );
}
