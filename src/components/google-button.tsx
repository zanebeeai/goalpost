import { signInWithGoogleAction } from "@/app/auth/actions";
import { GoogleSubmit } from "@/components/google-submit";

export function GoogleButton({ next }: { next?: string }) {
  return (
    <form action={signInWithGoogleAction}>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <GoogleSubmit />
    </form>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3 text-sm text-muted">
      <span className="h-px flex-1 bg-line" />
      or
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
