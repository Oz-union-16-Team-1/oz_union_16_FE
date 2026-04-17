import type { SupportChatQuickAction } from '@/features/support-chat/types/supportChat';

type SupportChatQuickActionsProps = {
  actions: SupportChatQuickAction[];
  disabled?: boolean;
  onSelect: (label: string) => void;
};

function SupportChatQuickActions({
  actions,
  disabled = false,
  onSelect,
}: SupportChatQuickActionsProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => onSelect(action.label)}
          disabled={disabled}
          className="support-chat-quick-action min-h-12 max-w-[80%] px-4 py-3 text-right text-sm/5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

export default SupportChatQuickActions;
