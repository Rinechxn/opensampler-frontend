import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
  title?: string;
  defaultName?: string;
}

export function FileDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  title = "Save File",
  defaultName = "untitled"
}: FileDialogProps) {
  const [fileName, setFileName] = React.useState(defaultName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Enter file name"
          />
          <Button onClick={() => {
            onSave(fileName);
            onOpenChange(false);
          }}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
