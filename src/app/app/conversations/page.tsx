export default function ConversationsIndexPage() {
  return (
    <div className="bg-muted/30 flex h-full flex-1 items-center justify-center">
      <div className="max-w-md text-center">
        <h2 className="text-foreground text-2xl font-semibold tracking-tight">
          Select a conversation to get started
        </h2>
        <p className="text-muted-foreground mt-3 text-sm">
          Choose a thread from the sidebar to review messages, continue a
          dialogue, or start a new conversation with your teammates.
        </p>
      </div>
    </div>
  );
}
