import { Button } from "@/components/ui/Button";
import { FOLDERS_COPY } from "@/constants/folders";
import { FoldersTile } from "@/components/sections/folders/FoldersTile";

/** "Go back to doing the work" — sign-up card next to an animated stack of folders. */
export function Folders() {
  return (
    <section className="folders relative z-2 py-section l:pt-144 l:pb-100 s:pt-100">
      <div className="container max-w-none px-cont">
        <div className="flex items-stretch gap-20 l:flex-col l:gap-10">
          <div className="folders_card flex flex-1 flex-col items-start gap-20 rounded-20 bg-white p-30 l:rounded-30">
            <h2 className="h3 max-w-428">{FOLDERS_COPY.title}</h2>
            <div className="folders_side flex flex-1 flex-col items-start justify-between gap-60 self-stretch">
              <p className="folders_text text-xl max-w-491 font-medium leading-1.4 tracking-[-0.03em]">{FOLDERS_COPY.text}</p>
              <Button track="folders-signup" />
            </div>
          </div>
          <FoldersTile />
        </div>
      </div>
    </section>
  );
}
