import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, UserPlus, LogIn } from 'lucide-react';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  action?: string;
}

export function AuthPromptModal({ isOpen, onClose, action = 'add items to cart' }: AuthPromptModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="font-serif text-2xl">Sign In Required</DialogTitle>
          <DialogDescription className="text-base">
            Please sign in or create an account to {action}. It only takes a moment!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 pt-4">
          <Link to="/auth?mode=login" className="block">
            <Button className="w-full btn-premium py-6 text-lg gap-2" onClick={onClose}>
              <LogIn className="w-5 h-5" />
              Sign In
            </Button>
          </Link>
          
          <Link to="/auth?mode=register" className="block">
            <Button variant="outline" className="w-full py-6 text-lg gap-2 border-2" onClick={onClose}>
              <UserPlus className="w-5 h-5" />
              Create Account
            </Button>
          </Link>
        </div>
        
        <p className="text-center text-sm text-muted-foreground pt-2">
          Join KRT Jewels to enjoy exclusive offers and track your orders
        </p>
      </DialogContent>
    </Dialog>
  );
}
