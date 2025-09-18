import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import MoreIcon from "../icons/more.svg";

export default function Agenttab() {
  const navigate = useNavigate();
  const agentArr = [
    {
      id: 1,
      name: "Multimodal Agent",
      avatar: "",
      type: "default",
      description:
        "Multimodal Agents support text, images, audio, and files — enabling richer, more accurate interactions.",
      model: "",
    },
    {
      id: 2,
      name: "Text Agent",
      avatar: "",
      type: "default",
      description:
        "A Text Agent supports only text interactions, optimized for chat, Q&A, and content generation with fast, efficient performance.",
      model: "",
    },
    {
      id: 3,
      name: "Product Manager",
      avatar: "",
      type: "custom",
      description:
        "A Text Agent supports only text interactions, optimized for chat, Q&A, and content generation with fast, efficient performance.A Text Agent supports only text interactions, optimized for chat, Q&A, and content generation with fast, efficient performance.",
      model: "",
    },
    {
      id: 4,
      name: "Coding Assistant",
      avatar: "",
      type: "custom",
      description: "",
      model: "",
    },
    {
      id: 5,
      name: "Coding Assistant",
      avatar: "",
      type: "custom",
      description: "",
      model: "",
    },
    {
      id: 6,
      name: "Strategic Product Manager",
      avatar: "",
      type: "custom",
      description: "",
      model: "",
    },
  ];
  return (
    <div className="flex items-center group">
      {agentArr.map((item) => (
        <div
          key={item.id}
          className="flex-center rounded-full backdrop-blur-lg size-8 border border-[#F2F2F2] dark:border-[#505050] hover:border-[#00D47E] dark:hover:border-[#4ADE80] hover:size-10 transition-all delay-100 -mr-3 group-hover:mr-2"
          style={{
            boxShadow: `
                0px 4px 4px 0px rgba(0, 0, 0, 0.11),
            `,
          }}
        ></div>
      ))}
      <div
        className="flex-center rounded-full backdrop-blur-lg size-8 border border-[#F2F2F2] dark:border-[#505050] hover:border-[#00D47E] dark:hover:border-[#4ADE80]"
        onClick={() => navigate(Path.Settings + "?tab=agent")}
        style={{
          boxShadow: `
                0px 4px 4px 0px rgba(0, 0, 0, 0.11),
            `,
        }}
      >
        <MoreIcon />
      </div>
    </div>
  );
}
