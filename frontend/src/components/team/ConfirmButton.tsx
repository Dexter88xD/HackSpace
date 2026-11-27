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
  disabled?: boolean;
  size?: "default" | "sm";
};

function ConfirmButton({
  label,
  title,
  description,
  confirmLabel,
  onConfirm,
  isPending,
  disabled = false,
  size = "default",
}: ConfirmButtonProps) {
  const isDisabled = isPending || disabled;

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="outline" size={size} disabled={isDisabled} />}
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
          render={
            <Button
              variant="default"
              size="lg"
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) onConfirm();
              }}
            />
          }
        >
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmButton;
