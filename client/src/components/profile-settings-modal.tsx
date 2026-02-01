import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProfileSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDisplayName: string;
  twitterUsername?: string | null;
}

export function ProfileSettingsModal({
  open,
  onOpenChange,
  currentDisplayName,
  twitterUsername,
}: ProfileSettingsModalProps) {
  const [displayName, setDisplayName] = useState(currentDisplayName);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setDisplayName(currentDisplayName);
    }
  }, [open, currentDisplayName]);

  const updateProfileMutation = useMutation({
    mutationFn: async (newDisplayName: string) => {
      const response = await apiRequest("PATCH", "/api/user/profile", {
        displayName: newDisplayName || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile Updated",
        description: "Your display name has been saved.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(displayName.trim());
  };

  const handleClear = () => {
    setDisplayName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Set a custom display name. Leave empty to show your X handle.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={twitterUsername ? `@${twitterUsername}` : "Enter display name"}
              maxLength={50}
              data-testid="input-display-name"
            />
            <p className="text-xs text-muted-foreground">
              {displayName.length}/50 characters
              {twitterUsername && !displayName && (
                <span className="ml-2">• Will show as @{twitterUsername}</span>
              )}
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          {currentDisplayName && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={updateProfileMutation.isPending}
              data-testid="button-clear-name"
            >
              Use X Handle
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={updateProfileMutation.isPending}
            data-testid="button-save-profile"
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
