import { Button } from "@/components/ui/button";
import { startOAuth } from "@/api/auth";

const buttonClass =
  "h-10 w-full justify-start border-l-4 bg-card px-3 text-foreground transition-all hover:-translate-y-0.5 hover:shadow-md";

// Google and 42 Intra sign-in buttons shared by the login and registration forms.
// The "!" on the left border colour is needed because the outline Button variant
// forces its own border colour with !important.
export function OAuthButtons() {
  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        type="button"
        className={`${buttonClass} !border-l-[#4285f4] hover:bg-[#4285f4]/5`}
        onClick={() => startOAuth("google")}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
          <path
            d="M21.35 12.27c0-.78-.07-1.54-.2-2.27H12v4.3h5.22a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.93-4.18 2.93-7.39Z"
            fill="#4285f4"
          />
          <path
            d="M12 21.8c2.63 0 4.84-.87 6.45-2.36l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.55 0-4.71-1.72-5.49-4.03H3.27v2.51A9.74 9.74 0 0 0 12 21.8Z"
            fill="#34a853"
          />
          <path
            d="M6.51 13.9A5.85 5.85 0 0 1 6.2 12c0-.66.11-1.3.31-1.9V7.59H3.27A9.76 9.76 0 0 0 2.25 12c0 1.59.38 3.1 1.02 4.41l3.24-2.51Z"
            fill="#fbbc05"
          />
          <path
            d="M12 6.07c1.43 0 2.72.49 3.73 1.46l2.8-2.8C16.84 3.15 14.63 2.2 12 2.2a9.74 9.74 0 0 0-8.73 5.39l3.24 2.51C7.29 7.79 9.45 6.07 12 6.07Z"
            fill="#ea4335"
          />
        </svg>
        Continue with Google
      </Button>
      <Button
        variant="outline"
        type="button"
        className={`${buttonClass} !border-l-[#00babc] hover:bg-[#00babc]/5`}
        onClick={() => startOAuth("42")}
      >
        <span className="flex size-5 items-center justify-center rounded-md bg-[#00babc] text-[10px] font-bold tracking-tight text-white">
          42
        </span>
        Continue with 42 Intra
      </Button>
    </div>
  );
}
