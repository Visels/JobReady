import {
  AuthLegalFootnote,
  AuthLoadingCard,
} from "@/components/ui/AuthScreenShell";
import { AuthCenteredShell } from "@/components/ui/AuthCenteredShell";

export default function LoginLoading() {
  return (
    <AuthCenteredShell footer={<AuthLegalFootnote action="continuing" />}>
      <AuthLoadingCard />
    </AuthCenteredShell>
  );
}
