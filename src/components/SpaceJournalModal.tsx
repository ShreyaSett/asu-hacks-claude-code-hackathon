import { useEffect, useRef, useState } from "react";
import { deleteMission, listMissions, renameMission, saveMission } from "@/lib/journal";
import type { MissionLog } from "@/lib/journal";
import type { ChatMessage } from "@/lib/types";

type Props = {
  currentMessages: ChatMessage[];
  onClose: () => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SpaceJournalModal({ currentMessages, onClose }: Props) {
  const [missions, setMissions] = useState<MissionLog[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [saved, setSaved] = useState(false);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMissions(listMissions());
  }, []);

  useEffect(() => {
    if (renaming) renameRef.current?.focus();
  }, [renaming]);

  function handleSaveCurrent() {
    if (currentMessages.length === 0) return;
    saveMission(currentMessages);
    setSaved(true);
    setMissions(listMissions());
  }

  function handleDelete(id: string) {
    deleteMission(id);
    setMissions(listMissions());
    if (expanded === id) setExpanded(null);
  }

  function handleRename(id: string) {
    if (!renameVal.trim()) return;
    renameMission(id, renameVal.trim());
    setMissions(listMissions());
    setRenaming(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Space Journal"
    >
      <div className="flex h-full max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-amber-400/30 bg-gradient-to-b from-slate-950 to-amber-950/20 shadow-glow">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="neon-text font-display text-xl font-bold">📓 Space Journal</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-b border-white/10 px-5 py-3">
          {currentMessages.length > 0 ? (
            <button
              type="button"
              onClick={handleSaveCurrent}
              disabled={saved}
              className="btn-neon w-full rounded-2xl py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {saved ? "✅ Mission saved!" : "💾 Save this session as a mission log"}
            </button>
          ) : (
            <p className="text-center text-sm text-slate-500">Start chatting with Cosmo to save a mission!</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {missions.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No missions yet — save your first chat above!</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {missions.map((m) => (
                <li key={m.id} className="rounded-2xl border border-white/10 bg-slate-900/60">
                  <div className="flex items-center gap-2 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      {renaming === m.id ? (
                        <input
                          ref={renameRef}
                          value={renameVal}
                          onChange={(e) => setRenameVal(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleRename(m.id); if (e.key === "Escape") setRenaming(null); }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full rounded-lg border border-amber-400/40 bg-slate-800 px-2 py-1 text-sm text-white outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      ) : (
                        <>
                          <p className="truncate font-display text-sm font-semibold text-amber-100">{m.name}</p>
                          <p className="text-xs text-slate-500">{formatDate(m.savedAt)} · {m.messages.length} messages</p>
                        </>
                      )}
                    </button>

                    {renaming === m.id ? (
                      <button type="button" onClick={() => handleRename(m.id)} className="shrink-0 text-xs text-green-400 hover:text-green-300">Save</button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setRenaming(m.id); setRenameVal(m.name); }}
                        className="shrink-0 text-xs text-slate-500 hover:text-slate-300"
                        aria-label="Rename mission"
                      >
                        ✏️
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      className="shrink-0 text-xs text-red-500/70 hover:text-red-400"
                      aria-label="Delete mission"
                    >
                      🗑
                    </button>
                  </div>

                  {expanded === m.id && (
                    <ul className="border-t border-white/5 px-4 pb-3 pt-2 flex flex-col gap-2 max-h-52 overflow-y-auto">
                      {m.messages.map((msg) => (
                        <li key={msg.id}>
                          <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-slate-600">
                            {msg.role === "user" ? "You" : "Cosmo"}
                          </p>
                          <p className="text-xs leading-relaxed text-slate-300">{msg.text}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
