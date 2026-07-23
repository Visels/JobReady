import {
  AuthLegalFootnote,
  AuthLoadingCard,
  AuthScreenShell,
} from "@/components/ui/AuthScreenShell";

export default function MagicLinkLoading() {
  return (
    <AuthScreenShell footer={<AuthLegalFootnote action="continuing" />}>
      <AuthLoadingCard />
    </AuthScreenShell>
  );
}
