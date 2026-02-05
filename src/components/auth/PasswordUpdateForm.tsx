import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function PasswordUpdateForm() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please re-enter your password.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Use at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({
        title: "Password set",
        description: "You're all set — taking you to the dashboard.",
      });

      // Clean up hash tokens from the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Password update error:", err);
      toast({
        title: "Unable to set password",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleUpdatePassword} className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Set your password</h2>
        <p className="text-muted-foreground">Finish setup to access the CRM.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password"
          required
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter password"
          required
          className="h-11"
        />
      </div>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Set password
      </Button>

      <p className="text-sm text-muted-foreground text-center">
        Tip: if this page says your link is expired, ask an admin to resend an invite or use “Send password reset”.
      </p>
    </form>
  );
}
