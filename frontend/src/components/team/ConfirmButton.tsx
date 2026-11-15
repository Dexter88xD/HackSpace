import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ConfirmButtonProps = {
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  isPending: boolean;
  size?: "sm" | "lg";
};

// A button that asks "are you sure?" before running the action.
function ConfirmButton({
  label,
  title,
  description,
  confirmLabel,
  onConfirm,
  isPending,
  size = "lg",
}: ConfirmButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="outline" size={size} disabled={isPending} />}
      >
        {label}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogCancel>Cancel</AlertDialogCancel>

        <AlertDialogAction
          render={<Button variant="default" size="lg" onClick={onConfirm} />}
        >
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmButton;
