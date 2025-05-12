'use client'

import React, { useState, useCallback, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { GOAL_STATUS, GOAL_TYPE } from "@/utils/types/goal";
import { createOrganizationGoal } from "@/utils/actions/goals-organization";

// Form data type definition
type GoalFormData = {
  title: string;
  description: string;
  type: string;
  target: string;
  startDate: Date;
  dueDate: Date;
  assignTo: string; // 'organization' or 'individual'
  userUlid?: string;
};

// Component props
interface GoalFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  members: any[];
  organizationUlid: string | null;
  formatGoalType: (type: string) => string;
}

export default function GoalFormDialog({
  isOpen,
  onClose,
  onSuccess,
  members,
  organizationUlid,
  formatGoalType
}: GoalFormDialogProps) {
  const { toast } = useToast();
  
  // Use ref for form data to avoid triggering re-renders on every change
  const formDataRef = useRef<GoalFormData>({
    title: "",
    description: "",
    type: Object.values(GOAL_TYPE)[0],
    target: "",
    startDate: new Date(),
    dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    assignTo: "organization",
    userUlid: undefined
  });
  
  // Local state used only for UI rendering
  const [formState, setFormState] = useState<GoalFormData>({ ...formDataRef.current });
  
  // Reset form handler
  const resetForm = useCallback(() => {
    const defaultFormData = {
      title: "",
      description: "",
      type: Object.values(GOAL_TYPE)[0],
      target: "",
      startDate: new Date(),
      dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      assignTo: "organization",
      userUlid: undefined
    };
    
    formDataRef.current = defaultFormData;
    setFormState(defaultFormData);
  }, []);
  
  // Handle dialog close with reset
  const handleClose = useCallback(() => {
    onClose();
    // Delay the reset to happen after the dialog closes
    setTimeout(() => {
      resetForm();
    }, 100);
  }, [onClose, resetForm]);
  
  // Update form data without triggering full re-renders
  const updateFormData = useCallback((field: string, value: any) => {
    // Update the ref first
    formDataRef.current = {
      ...formDataRef.current,
      [field]: value
    };
    
    // Then update state for UI rendering only
    setFormState(prevState => ({
      ...prevState,
      [field]: value
    }));
  }, []);
  
  // Handle form submission
  const handleSubmit = useCallback(async () => {
    try {
      // Use the ref data directly for submission
      const formData = formDataRef.current;
      
      // Debug input value
      console.log("[GOAL_FORM_DATA]", {
        rawTarget: formData.target,
        rawTargetType: typeof formData.target
      });

      // Create target object properly
      const targetValue = formData.target ? parseFloat(formData.target) : 0;
      const targetObject = { value: targetValue };

      console.log("[GOAL_TARGET_CONVERSION]", {
        parsedValue: targetValue,
        parsedValueType: typeof targetValue,
        targetObject,
        targetObjectType: typeof targetObject
      });

      const goalData = {
        ...formData,
        organizationUlid: formData.assignTo === 'organization' ? organizationUlid : undefined,
        userUlid: formData.assignTo === 'individual' ? formData.userUlid : undefined,
        target: targetObject,
        progress: { value: 0 },
      };

      console.log("[GOAL_SUBMIT]", {
        goalData,
        target: goalData.target,
        targetType: typeof goalData.target,
        targetValue: goalData.target.value,
        targetValueType: typeof goalData.target.value
      });

      const { data, error } = await createOrganizationGoal(goalData);
      
      if (error) {
        console.error("[GOAL_CREATE_ERROR]", error);
        throw new Error(error.message);
      }

      toast({
        title: "Goal created",
        description: "The goal has been successfully created",
      });

      // Close the dialog immediately to improve UX
      handleClose();
      
      // Add a small delay before triggering the onSuccess callback
      // This ensures the dialog is closed before any potential UI refresh
      setTimeout(async () => {
        try {
          await onSuccess();
          console.log("[GOAL_REFRESH_SUCCESS]", {
            timestamp: new Date().toISOString()
          });
        } catch (refreshError) {
          console.error("[GOAL_REFRESH_ERROR]", refreshError);
        }
      }, 100);
    } catch (error: any) {
      console.error("[GOAL_CREATE_EXCEPTION]", error);
      toast({
        title: "Error creating goal",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [organizationUlid, toast, onSuccess, handleClose]);
  
  // Use Dialog.Root to completely isolate this component 
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
          <DialogDescription>
            Set a new goal for your organization, team, or individual.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium">Goal Title</label>
            <Input
              id="title"
              placeholder="E.g., Increase Sales Volume"
              value={formState.title}
              onChange={(e) => updateFormData('title', e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Input
              id="description"
              placeholder="Description of the goal"
              value={formState.description}
              onChange={(e) => updateFormData('description', e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="type" className="text-sm font-medium">Goal Type</label>
            <Select 
              value={formState.type} 
              onValueChange={(value) => updateFormData('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select goal type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(GOAL_TYPE).map((type) => (
                  <SelectItem key={type} value={type}>
                    {formatGoalType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="target" className="text-sm font-medium">Target Value</label>
            <Input
              id="target"
              type="number"
              placeholder="Target value (e.g., 100000)"
              value={formState.target}
              onChange={(e) => updateFormData('target', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              For monetary values, enter the amount without currency symbols
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !formState.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formState.startDate ? format(formState.startDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formState.startDate}
                    onSelect={(date) => date && updateFormData('startDate', date)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !formState.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formState.dueDate ? format(formState.dueDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formState.dueDate}
                    onSelect={(date) => date && updateFormData('dueDate', date)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid gap-2">
            <label className="text-sm font-medium">Assign To</label>
            <Select 
              value={formState.assignTo} 
              onValueChange={(value) => updateFormData('assignTo', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="organization">Entire Organization</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {formState.assignTo === 'individual' && (
            <div className="grid gap-2">
              <label className="text-sm font-medium">Select Team Member</label>
              <Select 
                value={formState.userUlid} 
                onValueChange={(value) => updateFormData('userUlid', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member: any) => (
                    <SelectItem key={member.user.ulid} value={member.user.ulid}>
                      {member.user.firstName} {member.user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Goal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
