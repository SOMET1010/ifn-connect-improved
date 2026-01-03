import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, X } from 'lucide-react';
import { helpContent, HelpContent } from '@/lib/helpContent';

interface HelpDialogProps {
  pageKey: string;
  className?: string;
}

export default function HelpDialog({ pageKey, className = '' }: HelpDialogProps) {
  const [open, setOpen] = useState(false);

  const content: HelpContent | undefined = helpContent[pageKey];

  if (!content) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className={`fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg bg-orange-500 hover:bg-orange-600 text-white border-0 z-40 ${className}`}
        onClick={() => setOpen(true)}
        aria-label="Aide"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">{content.title}</DialogTitle>
                  <DialogDescription className="text-base mt-1">
                    {content.description}
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            {content.sections.map((section, index) => (
              <div key={index} className="space-y-3">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  {section.icon && <span>{section.icon}</span>}
                  {section.title}
                </h3>
                <div className="space-y-2 text-gray-700">
                  {section.content.map((item, itemIndex) => (
                    <p key={itemIndex} className="leading-relaxed">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {content.tips && content.tips.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
                <h4 className="font-bold text-orange-800 flex items-center gap-2">
                  💡 Astuces
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-orange-800">
                  {content.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {content.shortcuts && content.shortcuts.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <h4 className="font-bold text-blue-800 flex items-center gap-2">
                  ⌨️ Raccourcis clavier
                </h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  {content.shortcuts.map((shortcut, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{shortcut.description}</span>
                      <kbd className="px-2 py-1 bg-white rounded border border-blue-300 font-mono text-xs">
                        {shortcut.key}
                      </kbd>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t">
            <Button
              onClick={() => setOpen(false)}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              J'ai compris
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
